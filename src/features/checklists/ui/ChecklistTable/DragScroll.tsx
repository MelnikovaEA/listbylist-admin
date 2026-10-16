'use client';

import type { PointerEvent, ReactNode } from 'react';
import { useRef } from 'react';
import {TableContainer} from '@/src/components/TableContainer/TableContainer';
import styles from './ChecklistTable.module.css';

export function DragScroll({ children }: { children: ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const startScrollLeft = useRef(0);
    const dragged = useRef(false);

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [data-no-drag]')) return;

        const container = containerRef.current;
        if (!container) return;

        startX.current = event.clientX;
        startScrollLeft.current = container.scrollLeft;
        dragged.current = false;
        container.setPointerCapture(event.pointerId);
        container.dataset.dragging = 'true';
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        const container = containerRef.current;
        if (!container?.hasPointerCapture(event.pointerId)) return;

        const distance = event.clientX - startX.current;
        if (Math.abs(distance) > 4) dragged.current = true;
        container.scrollLeft = startScrollLeft.current - distance;
    }

    function stopDragging(event: PointerEvent<HTMLDivElement>) {
        const container = containerRef.current;
        if (!container) return;

        if (container.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId);
        }
        delete container.dataset.dragging;
    }

    return (
        <TableContainer
            ref={containerRef}
            className={styles.tableWrap}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onClickCapture={(event) => {
                if (dragged.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    dragged.current = false;
                }
            }}
        >
            {children}
        </TableContainer>
    );
}
