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
  /** When true, never render the hardcoded fallback in view mode — wait for DB value. */
  requireDb?: boolean;
}

export function EditableText({
  contentKey,
  fallback = '',
  as: Component = 'span',
  className = '',
  multiline = false,
  section,
  field,
  requireDb = false,
}: EditableTextProps) {
  const { isEditMode, canEdit, selectElement, selectedElement } = useEditMode();
  const { getContent, content, loading } = useSiteContent();
  const { language } = useLanguage();

  const [isHovered, setIsHovered] = useState(false);

  const hasContent = !!content[contentKey];
  const dbValue = hasContent ? getContent(contentKey, language, '') : '';
  const currentValue = isEditMode && canEdit
    ? getContent(contentKey, language, fallback)
    : (dbValue || (requireDb ? '' : fallback));
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
    // Strict mode: hide until DB value is loaded (no flash of hardcoded text).
    if (requireDb && (loading || !dbValue)) {
      return (
        <Component className={cn(className, 'opacity-0 select-none')} aria-hidden="true">
          {'\u00A0'}
        </Component>
      );
    }
    if (!currentValue) return null;
    return <Component className={className}>{currentValue}</Component>;
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