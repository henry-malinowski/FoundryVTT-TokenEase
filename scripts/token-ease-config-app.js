import CONSTANTS from "./constants.js";
import { easeFunctions } from "./lib/ease.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Precompute choice lists once at module load time
const DEFAULT_MOVEMENT = Object.freeze({
	enabled: false,
	speed: 6,
	duration: 0,
	configEase: "Linear",
	configInOut: "InOut"
});

const EASE_LABELS = (() => {
	const labels = Object.keys(easeFunctions)
		.filter(ease => ease.indexOf("InOut") > -1)
		.map((e) => e.replace("easeInOut", ""));
	labels.unshift("Linear");
	return labels;
})();

const EASE_CHOICES = EASE_LABELS.reduce((acc, label) => {
	acc[label] = label;
	return acc;
}, {});

const IN_OUT_CHOICES = {
	"In": "In",
	"Out": "Out",
	"InOut": "InOut"
};

export default class TokenEaseConfig extends HandlebarsApplicationMixin(ApplicationV2) {

	/**
	 * @param {TokenDocument|PrototypeToken} token
	 */
	constructor(token) {
		super();
		this.token = token;
		this.data = this.#readExistingData(token);
	}

	static DEFAULT_OPTIONS = {
		tag: "form",
		classes: ["sheet", "token-ease-config"],
		window: {
			contentClasses: ["standard-form"],
			title: "Token-Ease Token Overrides",
			icon: "fa-solid fa-person-running"
		},
		position: { width: 400 },
		form: {
			closeOnSubmit: true,
			handler: TokenEaseConfig.#onSubmit
		}
	};

	static PARTS = {
		body: { template: `modules/token-ease/templates/prototype-token-ease.hbs`, scrollable: [""] },
		footer: { template: "templates/generic/form-footer.hbs" }
	};

	async _prepareContext(options) {
		const context = await super._prepareContext(options) ?? {};
		const settings = { ...this.data };
		return Object.assign(context, {
			rootId: this.id,
			settings,
			easeChoices: EASE_CHOICES,
			inOutChoices: IN_OUT_CHOICES,
			buttons: this.#prepareButtons()
		});
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const checkbox = this.element?.querySelector('input[name="flags.token-ease.movement.enabled"]');
		const fieldset = this.element?.querySelector('fieldset[data-token-ease-fields]');
		if (checkbox && fieldset) {
			fieldset.disabled = !checkbox.checked;
			checkbox.addEventListener("change", () => {
				fieldset.disabled = !checkbox.checked;
			});
		}
	}

	#prepareButtons() {
		return [
			{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "Update Token" }
		];
	}

	#readExistingData(token) {
		const existing = token.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.MOVEMENT_FLAG);
		return existing ?? { ...DEFAULT_MOVEMENT };
	}

	/**
	 * Form submit handler for ApplicationV2.
	 * @this {TokenEaseConfig}
	 */
	static async #onSubmit(event, form, formData) {
		if (event.type !== "submit") return;

		// Expand values and pluck movement object from nested flags
		const expanded = foundry.utils.expandObject(formData.object);
		const movement = expanded.flags[CONSTANTS.MODULE_NAME][CONSTANTS.MOVEMENT_FLAG];

		if (!movement.enabled) {
			return this.token.unsetFlag(CONSTANTS.MODULE_NAME, CONSTANTS.MOVEMENT_FLAG);
		}

		movement.ease = movement.configEase === "Linear"
			? "linear"
			: `ease${movement.configInOut}${movement.configEase}`;

		return this.token.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.MOVEMENT_FLAG, movement);
	}
}
