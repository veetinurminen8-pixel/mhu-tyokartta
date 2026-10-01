# MHU Työkartta -prototyyppi

Avaa `index.html` selaimessa. Karttatausta ja Leaflet-karttakirjasto latautuvat verkosta.

## Kartta ja hoitourakka

Vieraslajihavainnon karttamerkissä ja työlistassa käytetään Vieraslajit.fi-sivuston virallista tekstitöntä lajimerkkiä. Kuva ladataan sivustolta osoitteesta `https://vieraslajit.fi/assets/images/logos/vieraslajit_tekstiton.png`, ja sovelluksessa näkyy lähdeviite Vieraslajit.fi-sivulle. Sivusto kertoo [kuvien käyttöoikeuksista](https://vieraslajit.fi/info/i-7906), että kuvia saa käyttää niiden lisenssiehtojen mukaisesti; varmista käyttöoikeus erikseen ennen kaupallista julkaisua.

Prototyyppi on rajattu Väyläviraston maanteiden hoitourakka-aineiston urakkaan **Jämsä 23–28** (urakkakoodi **937**). Kartalle on tallennettu urakan 250 tieosuusgeometriaa Väyläviraston WFS-aineistosta. Käytetty karttataso on `tiestotiedot:maanteiden_hoitourakat_011025`, jonka tiedot olivat aineistossa päivitetty 2.2.2026. Väyläviraston aineiston lisenssi on CC BY 4.0. Paikkatiedot on paketoitu `jamsa-roads.js`-tiedostoon, jotta urakan tieosuuksien näyttö ei riipu sovelluksen käynnistyessä WFS-rajapinnan vasteesta.

Taustakarttana käytetään OpenStreetMapin tavallista karttalaattaa. Kartalla näkyvät OpenStreetMapin ja Väyläviraston lähdeviittaukset. OpenStreetMap-laattojen käyttö edellyttää verkkoyhteyttä, ja niiden saatavuus määräytyy palvelun käyttöehtojen mukaan.

Karttateeman voi vaihtaa kartan alareunasta OpenStreetMapin ja Taustakartta-teeman välillä. Taustakartta käyttää OpenStreetMap.de-palvelun karttalaattoja, joiden värit on vaimennettu vaalean taustakartan kaltaisiksi; kartalla näkyvät palvelun sekä OpenStreetMap-aineiston lähdeviittaukset. Maanmittauslaitoksen omaa taustakarttateemaa ei ole tässä prototyypissä mukana, koska sen avoin WMTS-palvelu vaatii henkilökohtaisen API-avaimen.

Klikkaamalla karttaa avautuu uuden työn lomake. Klikattu sijainti kohdistetaan lähimmälle urakan tieosuudelle; lomakkeen **Kartalta**-toiminnolla sijainnin voi valita tai tarkentaa uudelleen. Kartan raahaaminen siirtää näkymää avaamatta lomaketta.

Karttaotsikon paikannuspainikkeella voi näyttää tietokoneen tai muun käytössä olevan laitteen selaimen sijaintipalvelusta saaman sijainnin ja keskittää kartan siihen. Jokaisella haulla pyydetään tuore sijainti; selain näyttää myös sijaintipalvelun ilmoittaman tarkkuuden. Selain pyytää sijaintiluvan, ja paikannus edellyttää laitteen sijaintipalveluiden toimintaa sekä selaimen tukemaa turvallista yhteyttä. Sijainnin tarkkuus riippuu laitteen ja käyttöjärjestelmän tarjoamista tiedoista.

Työn tyypiksi voi valita liikennemerkin, kaidevaurion, päällystevaurion, tien painuman tai sortuman, **Rumpuhavainto**-merkinnän, pysäkki- tai levähdysalueen kunnossapidon, vaarallisen puun, tietyön, **Paikkaustarve**-merkinnän, **Vieraslajihavainto**-merkinnän tai muun työn. Päällystevauriolle näytetään käyttäjän toimittama kuoppaa kuvaava kuva ja pysäkki-/levähdysalueelle käyttäjän toimittama pysäkkikatoksen kuva. Vaaralliselle puulle näytetään kuusikuvake punaisella huutomerkillä; rumpuhavainnolle näytetään uritettua rumpuputkea kuvaava oma paikallinen SVG-kuvake. Tien painumalle on myös oma kuvake. Kuvakkeet näkyvät kartalla, työlistassa ja kartan ponnahdusikkunassa. Paikkaustarpeessa näytetään asfaltin kuoppaa kuvaava oma kuvake kartalla ja työlistassa. Työn kuvaus on vapaaehtoinen; työn tyyppi, sijainti ja liikennemerkille tunnus ovat edelleen pakollisia.

Kartalla olevan **Näytä kaikki työtyypit**-suodattimen kautta voi valita, mitkä tyypit näkyvät karttamerkkeinä. Suodatin tukee usean tyypin valintaa ja kaikki käytössä olevat tyypit ovat oletuksena näkyvissä; valinta tallentuu selaimeen. Suodatus vaikuttaa karttamerkkeihin, ei avoimien töiden listaan tai lukumääriin.

**Kaidevaurio**-tyypille näytetään itse tehty vaurioitunutta tienkaidetta kuvaava SVG-kuvake kartalla, työlistassa ja kartan ponnahdusikkunassa.

**Tietyö**-tyyppi käyttää Väyläviraston A11-merkkiä, joka vastaa lähetettyä kuvaa; sen päälle näytetään huutomerkki.

Liikennemerkin tunnuksia voi suodattaa haulla tai etsiä Väyläviraston merkkikuvastosta. Tunnukset ja nimet vastaavat [Väyläviraston ajantasaista kuvastoa](https://vayla.fi/vaylista/liikennemerkit/kaikki-merkit); esimerkiksi A10 on Töyssyjä, A15 Suojatien ennakkovaroitus, A17 Lapsia ja A21 Tienristeys. Tunnukselle löytyvä virallinen SVG-kuva näkyy karttamerkissä ja sen ponnahdusikkunassa. Varoitusmerkit (A-sarja) ja B5-väistämismerkki näkyvät kartalla kolmionmuotoisina, ja E1- sekä E2-merkit neliömäisinä; muiden merkkien ympärillä säilyy pyöreä tausta. Nopeusrajoitusmerkkinä C32 käytetään Väyläviraston kuvatiedostoa, jossa rajoituslukuna näkyy 60. Merkkikuvat ovat Väyläviraston CC0-lisensoimasta [liikennemerkkikirjastosta](https://github.com/finnishtransportagency/liikennemerkit).

Työtä lisättäessä tien puolen voi valita oikeaksi tai vasemmaksi. Tien puolen valinta on vapaaehtoinen, ja valittu tieto näkyy avoimen työn tiedoissa sekä karttaponnahduksessa.

Työn kortin tai karttamerkin **Muokkaa**-painikkeella voi muuttaa havaintoa jälkikäteen. Muokkauksessa aiempi kuva säilyy, ellei sitä korvata uudella. Työn voi kuitata valmiiksi kortilta tai karttaponnahduksesta; kuittaus poistaa merkinnän kartalta ja avoimien töiden listasta. Merkin avaaminen ei siirrä sivua automaattisesti avoimien töiden listaan.

- [Väyläviraston WFS-palvelu](https://avoinapi.vaylapilvi.fi/vaylatiedot/ows?service=WFS&request=GetCapabilities)
- [Maanteiden hoitourakka -aineisto](https://avoindata.suomi.fi/data/fi/dataset/maanteiden-hoitourakka)
- [OpenStreetMapin tekijänoikeus- ja lisenssitiedot](https://www.openstreetmap.org/copyright)
- [OpenStreetMapin karttalaattojen käyttöehdot](https://operations.osmfoundation.org/policies/tiles/)
- [OpenStreetMap.de-karttatiilet](https://tile.openstreetmap.de/)
- [Maanmittauslaitoksen API-avaimen käyttöohje](https://www.maanmittauslaitos.fi/rajapinnat/api-avaimen-ohje)

Esimerkkityöt ja käyttäjän lisäämät työt tallentuvat selaimen paikalliseen tallennustilaan. Prototyypissä ei ole palvelinta, käyttäjätunnistusta eikä yhteiskäyttöä.
