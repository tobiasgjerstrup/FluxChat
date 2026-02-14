import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-modal',
    imports: [],
    templateUrl: './modal.html',
    styleUrl: './modal.scss',
})
export class Modal {
    @Input() open = false;
    @Output() closed = new EventEmitter<void>();

    close() {
        this.closed.emit();
    }
}
