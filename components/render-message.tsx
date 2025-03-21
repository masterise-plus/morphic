import { JSONValue, Message, ToolInvocation } from 'ai'
import { useMemo } from 'react'
import { AnswerSection } from './answer-section'
import { ReasoningSection } from './reasoning-section'
import RelatedQuestions from './related-questions'
import { ToolSection } from './tool-section'
import { UserMessage } from './user-message'

interface RenderMessageProps {
  message: Message
  messageId: string
  getIsOpen: (id: string) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  chatId?: string
}

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  chatId
}: RenderMessageProps) {
  const relatedQuestions = useMemo(
    () =>
      message.annotations?.filter(
        annotation => (annotation as any)?.type === 'related-questions'
      ),
    [message.annotations]
  )

  // Render for manual tool call
  const toolData = useMemo(() => {
    const toolAnnotations =
      (message.annotations?.filter(
        annotation =>
          (annotation as unknown as { type: string }).type === 'tool_call'
      ) as unknown as Array<{
        data: {
          args: string
          toolCallId: string
          toolName: string
          result?: string
          state: 'call' | 'result'
        }
      }>) || []

    const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
      const existing = acc.get(annotation.data.toolCallId)
      if (!existing || annotation.data.state === 'result') {
        acc.set(annotation.data.toolCallId, {
          ...annotation.data,
          args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
          result:
            annotation.data.result && annotation.data.result !== 'undefined'
              ? JSON.parse(annotation.data.result)
              : undefined
        } as ToolInvocation)
      }
      return acc
    }, new Map<string, ToolInvocation>())

    return Array.from(toolDataMap.values())
  }, [message.annotations])

  // Extract the unified reasoning annotation directly.
  const reasoningAnnotation = useMemo(() => {
    const annotations = message.annotations as any[] | undefined
    if (!annotations) return null
    return (
      annotations.find(a => a.type === 'reasoning' && a.data !== undefined) ||
      null
    )
  }, [message.annotations])

  // Extract the reasoning time, content, and collapsed state from the annotation.
  // If annotation.data is an object, use its fields. Otherwise, default to a time of 0.
  const reasoningData = useMemo(() => {
    if (!reasoningAnnotation) return { time: 0, isCollapsed: false }
    if (
      typeof reasoningAnnotation.data === 'object' &&
      reasoningAnnotation.data !== null
    ) {
      // Check if this is explicitly set to be collapsed from the annotation
      const explicitlyCollapsed = !!reasoningAnnotation.data.isCollapsed

      // Extract model name from any annotations if available
      const modelName = reasoningAnnotation.data.model || ''
      const isDeepSeekR1 =
        typeof modelName === 'string' &&
        modelName.toLowerCase().includes('deepseek-r1')

      // Get provider ID if available
      const providerId = reasoningAnnotation.data.providerId || ''
      const isSambanovaDeepSeekR1 =
        isDeepSeekR1 && providerId.toLowerCase() === 'sambanova'

      return {
        time: reasoningAnnotation.data.time ?? 0,
        // Use the explicit isCollapsed value if present, otherwise default based on content
        // Make sure SambaNova DeepSeek R1 reasoning sections are collapsed by default
        isCollapsed:
          explicitlyCollapsed ||
          isSambanovaDeepSeekR1 ||
          (reasoningAnnotation.data.reasoning &&
            typeof reasoningAnnotation.data.reasoning === 'string' &&
            (reasoningAnnotation.data.reasoning.includes('<think>') ||
              reasoningAnnotation.data.reasoning.includes('</think>')))
      }
    }
    return { time: 0, isCollapsed: false }
  }, [reasoningAnnotation])

  if (message.role === 'user') {
    return <UserMessage message={message.content} />
  }

  // New way: Use parts instead of toolInvocations
  return (
    <>
      {toolData.map(tool => (
        <ToolSection
          key={tool.toolCallId}
          tool={tool}
          isOpen={getIsOpen(tool.toolCallId)}
          onOpenChange={open => onOpenChange(tool.toolCallId, open)}
        />
      ))}

      {/* Render reasoning from annotations when parts don't include reasoning */}
      {reasoningAnnotation &&
        !message.parts?.some(part => part.type === 'reasoning') &&
        reasoningAnnotation.data?.reasoning && (
          <ReasoningSection
            key={`${messageId}-reasoning-annotation`}
            content={{
              reasoning: reasoningAnnotation.data.reasoning,
              time: reasoningData.time
            }}
            isOpen={getIsOpen(messageId) && !reasoningData.isCollapsed}
            onOpenChange={open => onOpenChange(messageId, open)}
          />
        )}

      {message.parts?.map((part, index) => {
        switch (part.type) {
          case 'tool-invocation':
            return (
              <ToolSection
                key={`${messageId}-tool-${index}`}
                tool={part.toolInvocation}
                isOpen={getIsOpen(part.toolInvocation.toolCallId)}
                onOpenChange={open =>
                  onOpenChange(part.toolInvocation.toolCallId, open)
                }
              />
            )
          case 'text':
            return (
              <AnswerSection
                key={`${messageId}-text-${index}`}
                content={part.text}
                isOpen={getIsOpen(messageId)}
                onOpenChange={open => onOpenChange(messageId, open)}
                chatId={chatId}
              />
            )
          case 'reasoning':
            return (
              <ReasoningSection
                key={`${messageId}-reasoning-${index}`}
                content={{
                  reasoning: part.reasoning,
                  time: reasoningData.time
                }}
                isOpen={getIsOpen(messageId) && !reasoningData.isCollapsed}
                onOpenChange={open => onOpenChange(messageId, open)}
              />
            )
          // Add other part types as needed
          default:
            return null
        }
      })}
      {relatedQuestions && relatedQuestions.length > 0 && (
        <RelatedQuestions
          annotations={relatedQuestions as JSONValue[]}
          onQuerySelect={onQuerySelect}
          isOpen={getIsOpen(`${messageId}-related`)}
          onOpenChange={open => onOpenChange(`${messageId}-related`, open)}
        />
      )}
    </>
  )
}
