import {
    WorkflowEntrypoint,
    type WorkflowEvent,
    type WorkflowSleepDuration,
    type WorkflowStep,
  } from 'cloudflare:workers';
  import type { Bindings, UserResponseEvent, WritingReviewParams } from '../env';
  import { runAgentPrompt, truncate } from '../lib/ai';
  import { postToDiscord } from '../lib/discord';
  import { sendTelegramMessage } from '../lib/telegram';
  import { logInfo, logWarn } from '../logger';
  
  type ReviewBundle = {
    summary: string;
    correctness: string;
    clarity: string;
  };
  
  const SUMMARY_SYSTEM =
    'You summarize documents. Keep the output short, concrete, and factual.';
  const CORRECTNESS_SYSTEM =
    'You are a writing correctness reviewer. Find grammar, spelling, punctuation, and factual consistency issues.';
  const CLARITY_SYSTEM =
    'You are a writing clarity reviewer. Find confusing structure, ambiguous wording, and readability problems.';
  const REVISION_SYSTEM =
    'You revise writing using review feedback. Keep intent, improve quality, and return only revised text.';
  
  function buildReviewPrompt(title: string, text: string, context?: string) {
    return `${title}\n\n${context ? `Context:\n${context}\n\n` : ''}Text:\n${text}`;
  }
  
  function buildRevisionPrompt(
    original: string,
    review: ReviewBundle,
    previousFeedback?: string
  ) {
    const userFeedback = previousFeedback
      ? `User feedback from previous rejection:\n${previousFeedback}\n\n`
      : '';
  
    return `${userFeedback}Original text:\n${original}\n\nSummary agent:\n${review.summary}\n\nCorrectness agent:\n${review.correctness}\n\nClarity agent:\n${review.clarity}\n\nCreate a revised version that addresses correctness and clarity while preserving meaning.`;
  }
  
  function formatTelegramReviewMessage(
    instanceId: string,
    loop: number,
    review: ReviewBundle,
    revised: string
  ) {
    return [
      `Review loop ${loop}`,
      `Instance: ${instanceId}`,
      '',
      'Summary agent:',
      truncate(review.summary, 900),
      '',
      'Correctness agent:',
      truncate(review.correctness, 900),
      '',
      'Clarity agent:',
      truncate(review.clarity, 900),
      '',
      'Consolidated revision:',
      truncate(revised, 1200),
      '',
      `Approve: /approve ${instanceId}`,
      `Reject: /reject ${instanceId} <feedback>`,
    ].join('\n');
  }
  
  export class WritingReviewWorkflow extends WorkflowEntrypoint<
    Bindings,
    WritingReviewParams
  > {
    async run(event: WorkflowEvent<WritingReviewParams>, step: WorkflowStep) {
      logInfo('workflow.run.start', { instanceId: event.instanceId });
      const input = await step.do('validate payload', async () => {
        if (!event.payload.r2Key) {
          throw new Error('r2Key is required');
        }
  
        if (!event.payload.telegramChatId) {
          throw new Error('telegramChatId is required');
        }
  
        return {
          r2Key: event.payload.r2Key,
          telegramChatId: event.payload.telegramChatId,
          context: event.payload.context?.trim(),
        };
      });
  
      const sourceText = await step.do(
        'load source document from r2',
        async () => {
          const object = await this.env.REVIEW_DOCUMENTS.get(input.r2Key);
          if (!object) {
            throw new Error(`R2 object not found: ${input.r2Key}`);
          }
  
          const text = (await object.text()).trim();
          if (!text) {
            throw new Error('R2 object is empty');
          }
  
          return text;
        }
      );
  
      const maxLoops = Number(this.env.MAX_REVIEW_LOOPS ?? '5');
      const timeout = (this.env.RESPONSE_TIMEOUT ??
        '7 days') as WorkflowSleepDuration;
  
      const runLoop = async (
        loop: number,
        draft: string,
        previousFeedback: string
      ): Promise<{ approved: boolean; loops: number; finalText: string }> => {
        if (loop > maxLoops) {
          logWarn('workflow.loop.max_reached', {
            instanceId: event.instanceId,
            maxLoops,
          });
          await step.do('notify max loop reached', async () => {
            await sendTelegramMessage(
              this.env,
              input.telegramChatId,
              `Review stopped after ${maxLoops} loops for ${event.instanceId}. Start again if you still need revisions.`
            );
          });
  
          return {
            approved: false,
            loops: maxLoops,
            finalText: draft,
          };
        }
  
        const summaryPromise = step.do(
          `summary agent (loop ${loop})`,
          async () => {
            return runAgentPrompt(
              this.env,
              SUMMARY_SYSTEM,
              buildReviewPrompt(
                'Summarize this text in 5 bullet points.',
                draft,
                input.context
              )
            );
          }
        );
  
        const correctnessPromise = step.do(
          `correctness agent (loop ${loop})`,
          async () => {
            return runAgentPrompt(
              this.env,
              CORRECTNESS_SYSTEM,
              buildReviewPrompt(
                'List correctness issues and suggested fixes.',
                draft,
                input.context
              )
            );
          }
        );
  
        const clarityPromise = step.do(
          `clarity agent (loop ${loop})`,
          async () => {
            return runAgentPrompt(
              this.env,
              CLARITY_SYSTEM,
              buildReviewPrompt(
                'List clarity issues and suggested fixes.',
                draft,
                input.context
              )
            );
          }
        );
  
        const [summary, correctness, clarity] = await Promise.all([
          summaryPromise,
          correctnessPromise,
          clarityPromise,
        ]);
  
        const review = { summary, correctness, clarity };
  
        const revised = await step.do(
          `run consolidation agent (loop ${loop})`,
          async () => {
            return runAgentPrompt(
              this.env,
              REVISION_SYSTEM,
              buildRevisionPrompt(draft, review, previousFeedback)
            );
          }
        );
  
        await step.do(`send telegram review (loop ${loop})`, async () => {
          const message = formatTelegramReviewMessage(
            event.instanceId,
            loop,
            review,
            revised
          );
          await sendTelegramMessage(this.env, input.telegramChatId, message);
        });
  
        const approval = await step.waitForEvent<UserResponseEvent>(
          `wait for user response (loop ${loop})`,
          {
            type: 'user-response',
            timeout,
          }
        );
  
        if (approval.payload.approved) {
          logInfo('workflow.loop.approved', {
            instanceId: event.instanceId,
            loop,
            source: approval.payload.source,
          });
          await step.do('publish approved text to discord', async () => {
            const reviewer = approval.payload.responder
              ? `Approved by: ${approval.payload.responder}\n\n`
              : '';
  
            await postToDiscord(
              this.env,
              `${reviewer}${truncate(revised, 1800)}`
            );
          });
  
          return {
            approved: true,
            loops: loop,
            finalText: revised,
          };
        }
  
        logInfo('workflow.loop.rejected', {
          instanceId: event.instanceId,
          loop,
          source: approval.payload.source,
        });
  
        return runLoop(
          loop + 1,
          revised,
          approval.payload.feedback?.trim() ?? ''
        );
      };
  
      return runLoop(1, sourceText, '');
    }
  }