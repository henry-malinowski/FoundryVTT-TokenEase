import { keyboardState } from "./settings.js";
import CONSTANTS from "./constants.js";
import { easeFunctions } from "./lib/ease.js";

function getAnimationsOptions_TokenEaseFactory(original) {
	
	return function (token) {
		const base = (typeof original === "function") ? (original.call(this, token) ?? {}) : {};		

		// If keyboard moved token should be forced linear, early-return with linear easing
		if (token?.__tokenEaseKeyboardMove) {
			return base;
		}

		// derive the speed multiplier from Foundry's cost function
		const speedMul = (base?.movementSpeed ?? CONFIG.Token.movement.defaultSpeed) / CONFIG.Token.movement.defaultSpeed;

		// If the owner of the token is holding down alt, the token will instantly move to the end point
		if (token.isOwner && keyboardState.instantMove) {
			base.duration = 0;
			return base;
		}

		// Get token-specific flags
		const flags = token.document.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.MOVEMENT_FLAG) ?? {};

		// Get world settings if the token is not set to override them (i.e.override not enabled or no flags setup)
		if (!flags?.enabled)
		{
			flags.speed = game.settings.get(CONSTANTS.MODULE_NAME, "default-speed");
			flags.duration = game.settings.get(CONSTANTS.MODULE_NAME, "default-duration");
			flags.ease = game.settings.get(CONSTANTS.MODULE_NAME, "default-ease");
		}

		// Apply Foundry's animation speed adjustments if enabled
		if (game.settings.get(CONSTANTS.MODULE_NAME, "apply-foundry-movespeed-adjustments")) 
		{
			flags.speed *= speedMul;
			flags.duration *= speedMul;
		}

		// Duration has priority when set (> 0), else use movement speed
		if (flags.duration > 0) base.duration = flags.duration;
		else base.movementSpeed = flags.speed;

		base.easing = flags.ease;
		return base;
	};
}

export function inject_token_animations() {
	const actions = CONFIG.Token.movement.actions;
	for (const [action, cfg] of Object.entries(actions)) {
		// skip override if the action is teleporting
		if (cfg?.teleport === true) continue;

		const original = cfg.getAnimationOptions;
		cfg.getAnimationOptions = getAnimationsOptions_TokenEaseFactory(original);
	}
}

export function inject_canvas_animations() {
	const { CanvasAnimation } = foundry.canvas.animation;
	for (const [name, func] of Object.entries(easeFunctions)) {
		CanvasAnimation[name] = func;
	}
}
