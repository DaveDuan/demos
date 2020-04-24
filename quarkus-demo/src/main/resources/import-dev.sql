INSERT INTO person(id,name, identityCode) VALUES (1, '66666666', '66666666');
INSERT INTO person(id,name, identityCode) VALUES (2, '88888888', '88888888');

INSERT INTO tabgroup(id, type, name, createDT, person_code) VALUES (1, 'AUTO', '1-First tab group', now(), '66666666');
INSERT INTO tabgroup(id,type, name, createDT, person_code) VALUES (2,'MANUAL', '1-Second tab group', now(), '66666666');

INSERT INTO tabgroup(id,type, name, createDT, person_code) VALUES (3, 'AUTO','2-First tab group', now(), '88888888');
INSERT INTO tabgroup(id,type, name, createDT, person_code) VALUES (4, 'MANUAL','2-Second tab group', now(), '88888888');


INSERT INTO tab(id, group_id, title, link, progress) VALUES (1, 1, 'Google', 'https://google.com', 20);
INSERT INTO tab(id, group_id, title, link, progress) VALUES (2, 1, 'Facebook', 'https://facebook.com', 30);
INSERT INTO tab(id, group_id, title, link, progress) VALUES (3, 2, 'Github', 'https://github.com', 40);

INSERT INTO tab(id, group_id, title, link, progress) VALUES (4, 3, 'Google', 'https://google.com', 20);
INSERT INTO tab(id, group_id, title, link, progress) VALUES (5, 3, 'Facebook', 'https://facebook.com', 30);
INSERT INTO tab(id, group_id, title, link, progress) VALUES (6, 4, 'Github', 'https://github.com', 40);
UPDATE hibernate_sequence SET next_val = 100;