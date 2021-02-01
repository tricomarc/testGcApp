export class Item {
	id: number;
	title: string;
	src: string;
	required: boolean;
	accepted: boolean;

	public static parse(json: any): Item {
		const item = new Item();
		try {
			item.id = json.id;
			item.title = json.titulo;
			item.accepted = json.aceptado;
			item.required = json.obligatorio;
			item.src = json.url;
		} catch (e) { }
		return item;
	}
}