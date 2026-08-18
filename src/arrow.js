import { createSVG } from './svg_utils';

export default class Arrow {
    constructor(gantt, from_task, to_task) {
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;

        this.calculate_path();
        this.draw();
    }

    /**
     * Orthogonal finish-to-start routing:
     * start at the right edge (vertical center) of the predecessor bar,
     * end at the left edge (vertical center) of the successor bar.
     * Avoids the previous mid-bar + curve path that often crossed bars
     * when tasks overlapped or the successor started to the left.
     */
    calculate_path() {
        const options = this.gantt.options;
        const from_bar = this.from_task.$bar;
        const to_bar = this.to_task.$bar;
        const padding = options.padding;
        const bar_height = options.bar_height;
        const header_height = this.gantt.config.header_height;
        const from_index = this.from_task.task._index;
        const to_index = this.to_task.task._index;

        const start_x = from_bar.getX() + from_bar.getWidth();
        const start_y =
            header_height +
            bar_height / 2 +
            (padding + bar_height) * from_index +
            padding / 2;
        const end_x = to_bar.getX();
        const end_y =
            header_height +
            bar_height / 2 +
            (padding + bar_height) * to_index +
            padding / 2;

        // Reuse arrow_curve as the stub/gap size for orthogonal corners.
        const gap = Math.max(padding / 2, options.arrow_curve || 5, 8);
        const arrowhead = `
            m -5 -5
            l 5 5
            l -5 5`;

        if (end_x >= start_x) {
            const stub = start_x + gap;
            if (stub < end_x) {
                this.path = `
                    M ${start_x} ${start_y}
                    H ${stub}
                    V ${end_y}
                    L ${end_x} ${end_y}${arrowhead}`;
            } else {
                this.path = `
                    M ${start_x} ${start_y}
                    L ${end_x} ${end_y}${arrowhead}`;
            }
        } else {
            // Successor starts at/before predecessor end: route around the bars.
            const stub = start_x + gap;
            const left = end_x - gap;
            const going_down = from_index < to_index;
            const mid_y = going_down
                ? Math.max(start_y, end_y) + bar_height / 2 + gap
                : Math.min(start_y, end_y) - bar_height / 2 - gap;

            this.path = `
                M ${start_x} ${start_y}
                H ${stub}
                V ${mid_y}
                H ${left}
                V ${end_y}
                L ${end_x} ${end_y}${arrowhead}`;
        }
    }

    draw() {
        this.element = createSVG('path', {
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id,
        });
    }

    update() {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    }
}
