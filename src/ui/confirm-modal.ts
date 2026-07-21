import { App, Modal, Setting } from "obsidian";

/**
 * Obsidian-native confirm dialog (avoids window.confirm).
 */
export function confirmAction(
  app: App,
  message: string,
  confirmLabel: string,
  cancelLabel: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new ConfirmModal(
      app,
      message,
      confirmLabel,
      cancelLabel,
      (ok) => resolve(ok)
    );
    modal.open();
  });
}

class ConfirmModal extends Modal {
  private decided = false;

  constructor(
    app: App,
    private message: string,
    private confirmLabel: string,
    private cancelLabel: string,
    private onDecide: (ok: boolean) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((b) =>
        b.setButtonText(this.cancelLabel).onClick(() => {
          this.decided = true;
          this.close();
          this.onDecide(false);
        })
      )
      .addButton((b) =>
        b
          .setButtonText(this.confirmLabel)
          .setWarning()
          .onClick(() => {
            this.decided = true;
            this.close();
            this.onDecide(true);
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.decided) {
      this.onDecide(false);
    }
  }
}
