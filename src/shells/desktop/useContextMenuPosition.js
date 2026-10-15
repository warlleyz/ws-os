
import { useLayoutEffect, useState } from 'react';

const MARGIN = 8;

export default function useContextMenuPosition(menuRef, context) {
    const [position, setPosition] = useState({
        left: context.x,
        top: context.y,
    });

    useLayoutEffect(() => {
        const menu = menuRef.current;
        const workspace = menu?.parentElement;

        if (!menu || !workspace) return;

        function updatePosition() {
            const width = menu.offsetWidth;
            const height = menu.offsetHeight;

            const minLeft = workspace.scrollLeft + MARGIN;
            const minTop = workspace.scrollTop + MARGIN;

            const maxLeft = Math.max(
                minLeft,
                workspace.scrollLeft +
                workspace.clientWidth -
                width -
                MARGIN,
            );

            const maxTop = Math.max(
                minTop,
                workspace.scrollTop +
                workspace.clientHeight -
                height -
                MARGIN,
            );

            const left = Math.max(
                minLeft,
                Math.min(context.x, maxLeft),
            );

            const top = Math.max(
                minTop,
                Math.min(context.y, maxTop),
            );

            setPosition((current) =>
                current.left === left && current.top === top
                    ? current
                    : { left, top },
            );
        }

        updatePosition();

        const observer = new ResizeObserver(updatePosition);
        observer.observe(menu);
        observer.observe(workspace);

        workspace.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        return () => {
            observer.disconnect();
            workspace.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [menuRef, context.x, context.y]);

    return position;
}
