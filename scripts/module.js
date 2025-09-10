import { configure_hotkeys, configure_settings } from "./settings.js";
import CONSTANTS from "./constants.js";
import { configure_sheets } from "./sheets.js";
import { inject_token_animations, inject_canvas_animations } from "./getAnimationOptions.js";

Hooks.once('init', async function () {
	console.log("Token Ease | Patching core functions");
	configure_settings();
	configure_hotkeys();
	configure_sheets();
	inject_token_animations();
});

Hooks.once("ready", async function () {
	// this injection must be delayed until after the canvas is ready
	inject_canvas_animations();
	console.log("Token Ease | Ready to (pl)ease!");
})

Hooks.once('libWrapper.Ready', () => {
	libWrapper.register(CONSTANTS.MODULE_NAME, 'TokenDocument.prototype._preUpdate', function (original, changed, options, user) {
		// don't do anything if the options.movement is not defined as this override shouldn't be touch those cases (i.e. change token vision)
		if (options?.movement) {
			const movement = options.movement[this.id] ?? {};
			const keyboardBlocked = (movement.method === "keyboard")
				&& !game.settings.get(CONSTANTS.MODULE_NAME, "animation-on-movement-keys");
			if (this.object) this.object.__tokenEaseKeyboardMove = keyboardBlocked;
		}
		return original.call(this, changed, options, user);
	}, 'WRAPPER');
});