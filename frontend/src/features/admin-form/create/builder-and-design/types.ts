export type DndPlaceholderProps =
  | {
      droppableId: string
      clientHeight: number
      clientWidth: string
      clientY: number
      clientX: number
    }
  | Record<string, never>
