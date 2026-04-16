---
title: "Jalakäijate liikumiste mudeldamine — Eesti Kunstiakadeemia"
url: https://www.artun.ee/et/galerii/jalakaijate-liikumiste-mudeldamine
depth: 6
date: 2026-04-16
---

[Galeriid](https://www.artun.ee/et/galerii/ "Mine Galeriid.")[Erialad](https://www.artun.ee/et/kategooria/erialad/?post_type=eka_project "Mine rubriigi Erialad arhiivi.")[Arhitektuuri­teaduskond](https://www.artun.ee/et/kategooria/erialad/arhitektuuriteaduskond/?post_type=eka_project "Mine rubriigi Arhitektuuri­teaduskond arhiivi.")[Arhitektuur ja linnaplaneerimine](https://www.artun.ee/et/kategooria/erialad/arhitektuuriteaduskond/arhitektuur-ja-linnaplaneerimine/?post_type=eka_project "Mine rubriigi Arhitektuur ja linnaplaneerimine arhiivi.")[Jalakäijate liikumiste mudeldamine](https://www.artun.ee/et/galerii/jalakaijate-liikumiste-mudeldamine/ "Mine Jalakäijate liikumiste mudeldamine.")

Uuringu käigus salvestati ligi 120 jalakäijate liikumistrajektoori ning loodi liikujapõhine simulatsioonimudel (agent-based computational model). Juba see lühike pilootprojekt lubas teha huvitavaid järeldusi ning andis aimu ruumi omadustest ja nüanssidest, mis jalakäijate liikumist suunavad ning mis paneb linnas jalgsi liikujad sihtpunkti jõudmiseks pikema teekonna valima.

Laiahaardelisem jalakäijate liikumise mudeldamise uuring viiakse läbi Peatänava projekti raames ([http://peatanav.ee](http://peatanav.ee/)), mis seab eesmärgiks läbi linnakeskkonna ümberkujundamise, autoliikluse aeglustamise ja uute ettevõtlusvõimaluste pakkumise Tallinna kesklinn jalakäijasõbralikumaks kujundada.

Esialgse uuringu tulemusel annavad kinnitust, et jalakäijate liikumist on võimalik edukalt simuleerida liikujapõhise arvutusmudeliga, millele eelneb jalakäijate käitumise uuring linnaruumis. Veelgi enam, saab väita, et täpselt seadistatud ja empiiriliste vaatluste põhjal tehtud simulatsioonimudeleid saavad planeerijad kasutada erinevate linnakeskkonna stsenaariumite läbimängimiseks ja hindamiseks.

Liikujapõhised mudelid ei ole uus suund linna ja ruumi analüüsis. Ehk kõige enam tuntakse linnaanalüüsi meetoditest Space Syntax-it. Näiteks Penn ja Turner on kasutanud eelkaluleeritud nähtavuse graafikuid (visibility graphs). Ent nende liikujatel ei ole linnaruumist mingeid eelteadmisi ega ka eelnevalt määratud sihtkohtasid – nad on pigem juhuslikud kõndijad, kes reageerivad puhtalt nähtavusele avatud ruumis. Selline käitumine on aga reaalsuses pigem tavapäratu. Vähemalt meie lühike pilootuuring Tallinna kesklinnas näitas, et ainult väga üksikutel juhtudel ei olnud inimestel selget liikumise sihtmärki ning lähtuti ad hoc liikumisotsustest. Sellest lähtudes on meie simulatsioonimudel vastupidine Space Syntax’i uuringutes kasutatud liikujapõhisele mudelile ning pelgalt alg- ja sihtmärgi mudeldamisele. Selle asemel me eeldame, et liikujad “on teadlikud” lühimast rajast oma alg- ja sihtmärgi vahel.

Samas ei pruugi liikuja alati valida kõige lühemat rada, sest tema liiklemisotsuseid mõjutavad mõned ruumilised tegurid, mis on seotud tänavaruumi morfoloogia ja keskkondlike aspektidega. Sellisteks teguriteks on näiteks laiemad jalakäijate teed, vähem müra, päikselisem ja rohelisem keskkond ja tegevused, mida teatud tänavad ja ruumid pakuvad.

Erinevate meetodite propageerijad, s.h ka Space Syntax-it kasutavad uurijad, väidavad, et jalakäijate liikumise simuleerimine on edukalt võimalik ka ilma kontekstita. Meie lähenemise puhul on aga oluline eeldus, et jalakäijate liikumist mõjutab sotsiokultuuriline taustsüsteem ning sellest lähtudes on nende liikumine riigiti ja linnati erinev. Seega esmalt vaatleme me jalakäijate liikumist kohapeal ning siis kohandame oma simulatsioonimudeli vastavalt nendele vaatlustele.

Meie pilootuuring näitab, kuidas sünteetilise mudeldamise põhimõtteid saab kasutada jalakäijate liiklemise simuleerimiseks linnaruumis. Sünteetilise mudeldamise puhul on võimalik arvutusliku simulatsiooni arendamine ja konfigureerimine vastavalt reaalse elu tingimustele. Sünteetilise mudeldaja jaoks ei ole oluline niivõrd mudeli komponentide täpsus kuivõrd see, et saavutada reaalelule vastavale olukorrale võimalikult sarnased liikumismustrid. Meie mudeli puhul on eesmärgiks kalibreerida ja muuta mudelit seni kuni simulatsioonimudelis liikuja poolt tehtavad valikud sarnanevad jalakäijate valikutele reaalelu vaatlustes.

Esimese sammuna kaardistasime jalakäijate liikumise valitud piirkonnas. 10-liikmeline üliõpilaste grupp salvestas GPS-mitmeid liikujapõhiseid simulatsioonimudeleid matkimaks jalakäijate käitumuslikke omadusi nende liikumises. Kui valitud algorütmid koondati ühte mudelisse, viidi läbi simulatsioonimudeli arengu iteratsioonid ja simulatsiooni tulemuste võrdlemine salvestatud GPS radadega. Simulatsioonimudelit muudeti ja võrreldi seejärel reaalelu andmetega kuni liikujate rajad simulatsioonimudelis omasid tugevat sarnasust GPS radadele. Hinnanguliselt annab selline lahendus võimaluse simuleerida ja uurida linnaruumi muutumise mõjusid 10 linnakvartali [ulatuses.ga](http://ulatuses.ga/) varustatud nutiseadmetega 2 tunni jooksul üle 100 jalakäija sammud valitud piirkonnas nende teekonna algusest kuni sihtmärgini. Salvestatud sammud kaardistati hiljem GIS programmiga. Seejärel loodi mitmeid liikujapõhiseid simulatsioonimudeleid matkimaks jalakäijate käitumuslikke omadusi nende liikumises. Kui valitud algorütmid koondati ühte mudelisse, viidi läbi simulatsioonimudeli arengu iteratsioonid ja simulatsiooni tulemuste võrdlemine salvestatud GPS radadega. Simulatsioonimudelit muudeti ja võrreldi seejärel reaalelu andmetega kuni liikujate rajad simulatsioonimudelis omasid tugevat sarnasust GPS radadele. Hinnanguliselt annab selline lahendus võimaluse simuleerida ja uurida linnaruumi muutumise mõjusid 10 linnakvartali ulatuses.

Projekti kestus: 2016-2017

Tellija: Eesti Arhitektuurikeskus

Autorid: Renee Puusepp, Martin Melioranski, Damiano Cerrone

Täismahus teaduspublikatsioon:

[https://www.researchgate.net/publication/306066288\_Synthetic\_Modelling\_of\_Pedestrian\_Movement\_Tallinn\_case\_study\_report](https://www.researchgate.net/publication/306066288_Synthetic_Modelling_of_Pedestrian_Movement_Tallinn_case_study_report)

[![Urbananalysis-1](https://www.artun.ee/app/uploads/fly-images/50093/Urbananalysis-1-2-300x300-c.jpg)](https://www.artun.ee/app/uploads/2017/03/Urbananalysis-1-2.jpg)

##### Jaga sõpradega:

[](http://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.artun.ee%2Fet%2Fgalerii%2Fjalakaijate-liikumiste-mudeldamine%2F&title=Jalak%C3%A4ijate+liikumiste+mudeldamine "Share on Facebook")[](http://twitter.com/share?text=Jalak%C3%A4ijate+liikumiste+mudeldamine&url=https%3A%2F%2Fwww.artun.ee%2Fet%2Fgalerii%2Fjalakaijate-liikumiste-mudeldamine%2F&via=kunstiakadeemia "Share on Twitter")[](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fwww.artun.ee%2Fet%2Fgalerii%2Fjalakaijate-liikumiste-mudeldamine%2F&title=Jalak%C3%A4ijate+liikumiste+mudeldamine&source=https%3A%2F%2Fwww.artun.ee%2Fwp "Share on LinkedIn")

Postitas Pille Epner  
Viimati muudetud 16\. märts 2017

[Arhitektuur ja linnaplaneerimine](https://www.artun.ee/et/erialad/arhitektuur-ja-linnaplaneerimine/)[Arhitektuuri­teaduskond](https://www.artun.ee/et/kategooria/erialad/arhitektuuriteaduskond/)[Lõppenud teadusprojektid](https://www.artun.ee/et/kategooria/tugistruktuurid/teadus-ja-arendusosakond/loppenud-teadusprojektid/)