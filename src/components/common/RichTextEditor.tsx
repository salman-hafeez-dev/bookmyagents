import React, { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number | string;
}

/**
 * The project's single rich text editor, lifted out of BlogForm so the legal
 * page editor uses exactly the same toolbar, markup and styling
 * (styles/blog-editor.css) rather than introducing a second editor.
 *
 * Behaviour is unchanged from the blog version with one fix that the move
 * required: it addresses its editable div through a ref instead of the
 * hardcoded `#rich-text-editor` id, so two editors can live on one screen
 * without writing into each other.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 300,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // The editable div is uncontrolled — React must not re-render its innerHTML
  // on every keystroke or the caret jumps to the start. Only sync when the
  // incoming content differs from what the DOM already holds (loading an
  // existing page into the form, or a reset after save).
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== content) {
      editor.innerHTML = content || '';
    }
  }, [content]);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleFormat = (command: string, value?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const insertLink = () => {
    if (disabled) return;
    const url = prompt('Enter URL:');
    if (url) handleFormat('createLink', url);
  };

  const toolbarButton = (
    title: string,
    icon: string,
    onClick: () => void,
  ) => (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      <i className={icon} aria-hidden="true"></i>
    </button>
  );

  return (
    <div className={`rich-text-editor ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="editor-toolbar">
        <div className="btn-group" role="group">
          {toolbarButton('Bold', 'fas fa-bold', () => handleFormat('bold'))}
          {toolbarButton('Italic', 'fas fa-italic', () => handleFormat('italic'))}
          {toolbarButton('Underline', 'fas fa-underline', () => handleFormat('underline'))}
        </div>

        <div className="btn-group" role="group">
          {toolbarButton('Heading', 'fas fa-heading', () => handleFormat('formatBlock', '<h2>'))}
          {toolbarButton('Sub-heading', 'fas fa-h', () => handleFormat('formatBlock', '<h3>'))}
          {toolbarButton('Paragraph', 'fas fa-paragraph', () => handleFormat('formatBlock', '<p>'))}
        </div>

        <div className="btn-group" role="group">
          {toolbarButton('Bullet List', 'fas fa-list-ul', () => handleFormat('insertUnorderedList'))}
          {toolbarButton('Numbered List', 'fas fa-list-ol', () => handleFormat('insertOrderedList'))}
        </div>

        <div className="btn-group" role="group">
          {toolbarButton('Align Left', 'fas fa-align-left', () => handleFormat('justifyLeft'))}
          {toolbarButton('Align Center', 'fas fa-align-center', () => handleFormat('justifyCenter'))}
          {toolbarButton('Align Right', 'fas fa-align-right', () => handleFormat('justifyRight'))}
        </div>

        <div className="btn-group" role="group">
          {toolbarButton('Insert Link', 'fas fa-link', insertLink)}
          {toolbarButton('Remove Formatting', 'fas fa-remove-format', () => handleFormat('removeFormat'))}
          {toolbarButton(
            isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
            `fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`,
            () => setIsFullscreen((previous) => !previous),
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        style={{
          minHeight: isFullscreen ? '70vh' : minHeight,
          maxHeight: isFullscreen ? '70vh' : 500,
          overflowY: 'auto',
        }}
        data-placeholder={placeholder || ''}
      />
    </div>
  );
};

export default RichTextEditor;
