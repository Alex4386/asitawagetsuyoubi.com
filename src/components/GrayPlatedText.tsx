import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type GrayPlatedTextOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
};

type GrayPlatedTextProps<T extends ElementType = 'span'> =
  GrayPlatedTextOwnProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof GrayPlatedTextOwnProps<T>>;

export default function GrayPlatedText<T extends ElementType = 'span'>({
  as,
  children,
  className,
  ...props
}: GrayPlatedTextProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component
      className={['panel-gray-text', className].filter(Boolean).join(' ')}
      {...props}>
      {children}
    </Component>
  );
}
