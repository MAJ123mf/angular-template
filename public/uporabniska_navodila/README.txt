UPORABNIŠKA NAVODILA - GeoSG
=============================

STRUKTURA:
----------
uporabniska_navodila/
├── index.html          ← Glavna HTML datoteka
├── images/             ← Poddirektorij s slikami
│   ├── img_main.png
│   ├── img_tools.png
│   ├── img_layers.png
│   ├── img_select.png
│   ├── img_parcel_selected.png
│   ├── img_ceste_form.png
│   ├── img_login.png
│   ├── img_django_admin.png
│   ├── img_status.png
│   └── img_swagger.png
└── README.txt          ← Ta datoteka

NAMESTITEV NA APACHE SERVER:
-----------------------------
1. Razširi ZIP arhiv: unzip uporabniska_navodila.zip
2. Kopiraj celoten direktorij uporabniska_navodila/ v DocumentRoot:
   cp -r uporabniska_navodila /var/www/html/
3. Dostop: http://localhost/uporabniska_navodila/

VKLJUČITEV V ANGULAR APLIKACIJO:
---------------------------------
1. Kopiraj direktorij uporabniska_navodila/ v Angular projekt pod src/assets/
2. V MenuComponent dodaj jezičko "Pomoč":
   <a routerLink="/pomoc">Pomoč</a>
3. Ustvari RouterModule route:
   { path: 'pomoc', component: PomocComponent }
4. V PomocComponent uporabi <iframe>:
   <iframe src="assets/uporabniska_navodila/index.html" 
           style="width:100%; height:calc(100vh - 60px); border:none;">
   </iframe>

ODPIRANJE KOT MODAL:
--------------------
V AppComponent dodaj metodo za odpiranje v Material Dialog:
openHelp() {
  this.dialog.open(HelpDialogComponent, {
    width: '90vw',
    height: '90vh',
    data: { url: 'assets/uporabniska_navodila/index.html' }
  });
}

SAMOSTOJNO GOSTOVANJE:
----------------------
Lahko tudi samostojno gostite na ločenem strežniku ali subdomeni:
http://pomoc.gurs.gov.si/

OPOMBE:
-------
- Vse slike so embedded v poddirektoriju images/
- HTML je samostojno delujočo (brez JavaScript odvisnosti)
- Responsive design - deluje na mobilnih napravah
- Slike so optimizirane (PNG format)
- Vsebuje razdelke: Uvod, Osnove, WMS/WFS sloji, Parcele, Stavbe, 
  Ceste, Naslovi, Napredne funkcije, FAQ

Verzija: 1.1 (Februar 2025)
