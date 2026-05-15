import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  contentKey: string;
  fallback?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  multiline?: boolean;
  section?: string;
  field?: string;
}

export function EditableText({
  contentKey,
  fallback = '',
  as: Component = 'span',
  className = '',
  multiline = false,
  section,
  field,
}: EditableTextProps) {
  const { isEditMode, canEdit, selectElement, selectedElement } = useEditMode();
  const { getContent, content, loading } = useSiteContent();
  const { language } = useLanguage();

  const [isHovered, setIsHovered] = useState(false);

  const hasContent = !!content[contentKey];
  // In view mode never show hardcoded fallback — only show DB value once loaded.
  const viewValue = hasContent ? getContent(contentKey, language, '') : '';
  // In edit mode keep fallback visible so admin sees default placeholder.
  const currentValue = isEditMode && canEdit
    ? getContent(contentKey, language, fallback)
    : viewValue;
  const isSelected = selectedElement?.contentKey === contentKey;

  const handleClick = () => {
    selectElement({
      type: 'text',
      contentKey,
      section,
      currentValue,
      fallback,
      multiline,
    });
  };

  // Not in edit mode or can't edit - render normally
  if (!isEditMode || !canEdit) {
    // While CMS data loads OR key has no DB row, render an invisible placeholder
    // (preserves layout height, never flashes hardcoded fallback).
    if (loading || !hasContent || !viewValue) {
      return (
        <Component className={cn(className, 'opacity-0 select-none')} aria-hidden="true">
          {'\u00A0'}
        </Component>
      );
    }
    return <Component className={className}>{viewValue}</Component>;
  }

  // In edit mode - show editable element
  return (
    <span 
      className="relative inline-block"
      data-editable="true"
      data-selected={isSelected ? "true" : undefined}
      data-section={section}
      data-field={field || contentKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Component 
        className={cn(
          className, 
          'cursor-pointer transition-all duration-200',
          isSelected 
            ? 'ring-2 ring-primary ring-offset-2 rounded bg-primary/10' 
            : isHovered 
              ? 'ring-2 ring-primary/50 ring-offset-2 rounded bg-primary/5' 
              : ''
        )}
        onClick={handleClick}
      >
        {currentValue || <span className="text-muted-foreground italic">Matn kiriting...</span>}
      </Component>
      
      {/* Edit icon on hover */}
      <button
        onClick={handleClick}
        className={cn(
          'absolute -top-2 -right-2 p-1 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-200 z-10',
          (isHovered || isSelected) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        )}
        title="Tahrirlash"
      >
        <Pencil className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}