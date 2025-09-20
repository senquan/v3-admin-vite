declare module "@wangeditor/editor-for-vue" {
  import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor"
  import type { DefineComponent } from "vue"

  export interface EditorProps {
    defaultConfig?: Partial<IEditorConfig>
    defaultContent?: string
    defaultHtml?: string
    mode?: "default" | "simple"
    modelValue?: string
    style?: Record<string, any>
    className?: string
    onCreated?: (editor: IDomEditor) => void
    onChange?: (editor: IDomEditor) => void
    onDestroyed?: (editor: IDomEditor) => void
    onFocus?: (editor: IDomEditor) => void
    onBlur?: (editor: IDomEditor) => void
    customAlert?: (info: string, type: string) => void
    customPaste?: (editor: IDomEditor, event: ClipboardEvent, callback: (html: string) => void) => void
  }

  export interface ToolbarProps {
    editor: IDomEditor
    defaultConfig?: Partial<IToolbarConfig>
    mode?: "default" | "simple"
    style?: Record<string, any>
    className?: string
  }

  export const Editor: DefineComponent<EditorProps>
  export const Toolbar: DefineComponent<ToolbarProps>
}
