import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from 'react';

import styles from '@/components/GoldPlatedText.module.css';

type GoldPlatedTextOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  gradient?: string;
  shadow?: string;
  style?: CSSProperties;
};

type GoldPlatedTextProps<T extends ElementType = 'span'> =
  GoldPlatedTextOwnProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof GoldPlatedTextOwnProps<T>>;

type GoldPlatedTextStyle = CSSProperties & {
  '--gold-plated-gradient'?: string;
  '--gold-plated-shadow'?: string;
};

export default function GoldPlatedText<T extends ElementType = 'span'>({
  as,
  children,
  className,
  gradient,
  shadow,
  style,
  ...props
}: GoldPlatedTextProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component
      className={[styles.goldPlatedText, className].filter(Boolean).join(' ')}
      style={
        {
          '--gold-plated-gradient': gradient,
          '--gold-plated-shadow': shadow,
          ...style,
        } as GoldPlatedTextStyle
      }
      {...props}>
      {children}
    </Component>
  );
}
