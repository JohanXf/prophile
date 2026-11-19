import React from "react";
import { navigateTo } from "./next-navigation";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, onClick, target, replace, scroll = true, prefetch: _prefetch, children, ...rest }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (target && target !== "_self") return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;

      e.preventDefault();
      navigateTo(href, replace, scroll);
    };

    return (
      <a ref={ref} href={href} target={target} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";
export default Link;
