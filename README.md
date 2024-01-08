#Pokretanje i korišćenje aplikacije:

1. instalirati npm zavisnosti (node modules) komadnom: nmp install
2. pokrenuti redis-server sa administratorskim privilegijama (testirano je sa windows build-om redisa 3.2.100)
3. pokrenuti express iz početnog direktorijuma aplikacije komandom: npm run server
4. pokrenuti react aplikaciju iz početnog direktorijuma aplikacije komandom: npm start
5. otvoriti dva različita taba u browseru i konektovati se na http://localhost:3000
6. u prvom tabu uneti korisničko ime pvog igrača i ime kanala a zatim klikom na dugme "create channel" kreira se kanal sa zadatim imenom i povezuje prvi igrač
7. u drugom tabu uneti ime drugog igrača i ime kanala na koji se povezuje i povezati se na kanal klikom na dugme "join channel" (da bi igra mogla da počne potrebno je da se oba korisnika povežu na kanal sa istim imenom)
8. nakon povezivanja potrebno je da oba igrača kliknu na dugme "Start" čime se inicijalizuje tabla i stanje igrača na serveru
9. kada se izvrši inicijalizacija igre na serveru, server šalje signal igračima (pomoću pub-sub mehanizma i socket io) da je igra inicijalizovana i da mogu da preuzmu prikaz table sa redisa
10. igrači naizmenično šalju svoje poteze (osim ukoliko je odigrana specijalna karta za preskakanje poteza) i updatuju svoj prikaz kada je novi potez odigran (signal da je odigran novi potez šalje se pomoću pub-sub mehanizma)
11. igra je završena kada jedan od igrača više nema karata u ruci (šalje se signal za kraj partije sa imenom pobednika)
12. nakon primljenog signala za kraj igre korisnici prikazju ekran za kraj partije i klikom na dugme "leave" vraćaju se na početni prikaz za priključenje/kreiranje kanala
13. moguće je odigravanje većeg broja partija istovremeno na različitim kanalima
