import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type GoldPlatedTextOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
};

type GoldPlatedTextProps<T extends ElementType = 'span'> =
  GoldPlatedTextOwnProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof GoldPlatedTextOwnProps<T>>;

export default function GoldPlatedText<T extends ElementType = 'span'>({
  as,
  children,
  className,
  ...props
}: GoldPlatedTextProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component
      className={['panel-gold-text', className].filter(Boolean).join(' ')}
      {...props}>
      {children}
    </Component>
  );
}
