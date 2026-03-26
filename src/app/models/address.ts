export class Address {
  constructor(
    public id: number,
    public building_num: number | null,  // null za placeholder
    public street: string,
    public house_num: string,
    public post_num: number | null,
    public post_name: string,
    public geom_wkt: string,
    public geom?: string       // ? pomeni da je to polje opcijsko, ni nujno da ga vedno uporabimo
  ) {}
}