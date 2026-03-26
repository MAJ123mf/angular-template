
export class Building {
    constructor(
      public id: string,
      public sifko: number | null,
      public st_stavbe: number | null,
      public description: string, 
      public area: number,
      public geom_wkt: string,
      public geom?:string
    ){}
  }