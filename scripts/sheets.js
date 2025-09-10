import CONSTANTS from "./constants.js";
import TokenEaseConfig from "./token-ease-config-app.js";

function addTokenEaseHeaderControl(app, controls) {
	controls.push({
		action: "tokenEase",
		icon: CONSTANTS.TOKEN_EASE_HEADER.icon,
		label: CONSTANTS.TOKEN_EASE_HEADER.label,
		onClick: () => {
			const token = app.document ?? app.token;
			if (token) new TokenEaseConfig(token).render({ force: true });
		}
	});
}

export async function configure_sheets() {
	// Preload templates used by this module
	await loadTemplates([
		'modules/token-ease/templates/prototype-token-ease.hbs'
	]);
		
	Hooks.on("getHeaderControlsTokenConfig", addTokenEaseHeaderControl);
	Hooks.on("getHeaderControlsPrototypeTokenConfig", addTokenEaseHeaderControl);
}
