--
-- PostgreSQL database dump
--

\restrict q3VY9f92rH6vBsSDhPU5s1rvuNyf0SAIHTFQQ2lZfHCcmsXWrfmcdaIjViwcKAg

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: ujian; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.ujian (id, title, description, max_questions, shuffle_questions, shuffle_answers, practice_mode, allow_resubmit, is_active, created_by, created_at, updated_at) FROM stdin;
l53rg5f98v1oe0ltz2ibp1a0	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 18:47:13.85395	2026-01-01 18:47:13.85395
h245uqutpwuznaqrkjgb9db6	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 18:47:13.85395	2026-01-01 18:47:13.85395
cwpww390vks6zzcu1zfuqyo0	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 18:47:13.85395	2026-01-01 18:47:13.85395
eojz0g9mgyr3u0qgc1yqsv1l	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 18:55:03.789826	2026-01-01 18:55:03.789826
vt6fj7ctdm2qmj58y1ziqq04	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 18:55:03.789826	2026-01-01 18:55:03.789826
dl2x50o6sen6117zvsymel5w	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 18:55:03.789826	2026-01-01 18:55:03.789826
esw671lch23ftx5ct2kj8i5k	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 18:57:18.734584	2026-01-01 18:57:18.734584
e9sab0ur0x73xboipzjra2sx	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 18:57:18.734584	2026-01-01 18:57:18.734584
zg1lpg9uy06jynshq83hl2ah	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 18:57:18.734584	2026-01-01 18:57:18.734584
dzke58b1oci3px3fsvt328vy	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 19:08:32.713945	2026-01-01 19:08:32.713945
t68ga1bdi0er6cyob3gjx180	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 19:08:32.713945	2026-01-01 19:08:32.713945
dei01b26au2xa4cvg7kqs033	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 19:08:32.713945	2026-01-01 19:08:32.713945
zcyqku8j7yykey2zeu3xdcvh	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 19:15:36.901923	2026-01-01 19:15:36.901923
q4yys4k1are3s5jxkge3o435	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 19:15:36.901923	2026-01-01 19:15:36.901923
oj8tiroog8ozjo9am6ew839k	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 19:15:36.901923	2026-01-01 19:15:36.901923
knh0c73pjsaspsk1o8plhci0	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 19:19:50.172413	2026-01-01 19:19:50.172413
q05zhh31tnaes40ygeyiaexc	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 19:19:50.172413	2026-01-01 19:19:50.172413
qnvjfjea45vt9okevx17tuz1	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 19:19:50.172413	2026-01-01 19:19:50.172413
w0ntel7rg43qy9uv87qw1e52	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-01 19:30:42.013158	2026-01-01 19:30:42.013158
nbc97jtab1aymdidhvbwbrhg	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-01 19:30:42.013158	2026-01-01 19:30:42.013158
wix0i25gx1tnc7wq24du1exn	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-01 19:30:42.013158	2026-01-01 19:30:42.013158
jo0qza2ieyl8c1vkedbpp6zr	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-03 10:31:16.002425	2026-01-03 10:31:16.002425
g29vrq0a6pj6fxhm6v8r11li	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-03 10:31:16.002425	2026-01-03 10:31:16.002425
cpoyvtgi1rao42w4r30ksmns	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-03 10:31:16.002425	2026-01-03 10:31:16.002425
o8t906ewjktc9ft0mirjnu5x	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-03 12:41:53.410235	2026-01-03 12:41:53.410235
hxm1kvnlw8oz8byq3vtzqy0o	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-03 12:41:53.410235	2026-01-03 12:41:53.410235
quslsrlrvbm3jmtir3mp257u	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-03 12:41:53.410235	2026-01-03 12:41:53.410235
m4ldq6rulnp01yblby192u9c	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-03 14:01:06.408403	2026-01-03 14:01:06.408403
e36x2v5fd2dv33easysjz8fk	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-03 14:01:06.408403	2026-01-03 14:01:06.408403
pe85kgh7nnxq4ukx57gjna5f	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-03 14:01:06.408403	2026-01-03 14:01:06.408403
yblis5kst1lmd1ey00log8lw	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-04 15:52:48.129299	2026-01-04 15:52:48.129299
n57mb5wkg2tmxtv1x4ufloy8	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-04 15:52:48.129299	2026-01-04 15:52:48.129299
ly389n459zo8sbtbrcs0x0hw	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-04 15:52:48.129299	2026-01-04 15:52:48.129299
lh8ualqa2v0kdonomqyr6waw	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-06 14:46:11.643627	2026-01-06 14:46:11.643627
apeddff8voykv87wss22pnn8	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-06 14:46:11.643627	2026-01-06 14:46:11.643627
xlwbtrq8g6fjchq82foyb7rc	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-06 14:46:11.643627	2026-01-06 14:46:11.643627
odyrgcon92cytpkctjczyn0z	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-06 16:34:24.439997	2026-01-06 16:34:24.439997
jsbf9cn7gnc0vyufyj5w0zyv	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-06 16:34:24.439997	2026-01-06 16:34:24.439997
qxbpagov8vp5io78bp1zlmzi	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-06 16:34:24.439997	2026-01-06 16:34:24.439997
nmzhhs903bypzfm1qrm06qg7	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-09 02:08:35.628259	2026-01-09 02:08:35.628259
i9bc0706rbxy4kh7tsfi8r74	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-09 02:08:35.628259	2026-01-09 02:08:35.628259
ft34m0twc3eev8ifts119b7t	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-09 02:08:35.628259	2026-01-09 02:08:35.628259
bmz6bfc4wtnifmdh7ueo4ptt	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-10 16:49:45.174386	2026-01-10 16:49:45.174386
tlzogdlb4bydswi90w3yaftx	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-10 16:49:45.174386	2026-01-10 16:49:45.174386
g6ldheqmviukn78mbp32lmgz	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-10 16:49:45.174386	2026-01-10 16:49:45.174386
tz7bhaj01uex3o1h3wocg8ge	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-10 16:51:20.784503	2026-01-10 16:51:20.784503
edrir05yzot8dpomrlevakw8	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-10 16:51:20.784503	2026-01-10 16:51:20.784503
r4thk9l4qp33hmo8hk91c5ep	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-10 16:51:20.784503	2026-01-10 16:51:20.784503
u3ylor52lf0kn3shqvt8weea	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-16 07:16:27.702259	2026-01-16 07:16:27.702259
n3ikggul8dhwv0bil3rdhabz	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-16 07:16:27.702259	2026-01-16 07:16:27.702259
xbrc5cdxtkypf6reppnp1d82	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-16 07:16:27.702259	2026-01-16 07:16:27.702259
uzzajyx0rywy096qc5oz3oa1	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-16 11:16:58.754666	2026-01-16 11:16:58.754666
dh5kg2n3kzy0cyhmuyedkrqo	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-16 11:16:58.754666	2026-01-16 11:16:58.754666
gfmwdsq7zacwrq3yk7asff6v	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-16 11:16:58.754666	2026-01-16 11:16:58.754666
k2t1ttpvhe378v3qismkcrr7	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-16 11:17:17.546235	2026-01-16 11:17:17.546235
useva20gl2ta9d29sue8jfg8	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-16 11:17:17.546235	2026-01-16 11:17:17.546235
o2vaghumdqxx28o89eift8ve	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-16 11:17:17.546235	2026-01-16 11:17:17.546235
lbd7fp06n8uxkf7290xxahpp	Ujian Matematika Dasar	Ujian matematika dasar untuk kelas 10	10	f	f	f	f	t	\N	2026-01-16 11:26:58.549367	2026-01-16 11:26:58.549367
sbuxrslic417ynkh3sl3i7dr	Latihan Bahasa Indonesia	Latihan soal bahasa Indonesia - dapat diulang	5	f	f	t	t	t	\N	2026-01-16 11:26:58.549367	2026-01-16 11:26:58.549367
de7j75djhyixnvmf3hcebrqu	Quiz IPA	Quiz singkat tentang IPA	15	f	f	f	t	t	\N	2026-01-16 11:26:58.549367	2026-01-16 11:26:58.549367
\.


--
-- Data for Name: ujian_attempts; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.ujian_attempts (id, ujian_id, user_id, started_at, completed_at, score, total_points, status, created_at) FROM stdin;
\.


--
-- Data for Name: ujian_questions; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.ujian_questions (id, ujian_id, question_text, question_type, options, correct_answer, points, order_index, created_at, updated_at) FROM stdin;
mw1bt2260v7zc2l1uxekaeu0	l53rg5f98v1oe0ltz2ibp1a0	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
v1fhr09ptg8g4umyjjthvdk6	l53rg5f98v1oe0ltz2ibp1a0	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
tmsor1w0agn4wc7c1knxv5w6	l53rg5f98v1oe0ltz2ibp1a0	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
pafwz6zwyf62cnqz46cnj0ro	l53rg5f98v1oe0ltz2ibp1a0	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
gr7kvv3n2805qsw4mwsok2k2	h245uqutpwuznaqrkjgb9db6	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
j0jd21qom4yac7zmx9pf94wd	h245uqutpwuznaqrkjgb9db6	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
cxlhqrjvkw83yj0nu3jkh6sg	h245uqutpwuznaqrkjgb9db6	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
ffo54n3t2vmyvrr7rvv1jnji	cwpww390vks6zzcu1zfuqyo0	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
y8ybes4tx4vrjuwago5mk1dz	cwpww390vks6zzcu1zfuqyo0	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
gml6d5w9egcpazsoy36n32bg	cwpww390vks6zzcu1zfuqyo0	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 18:47:13.860154	2026-01-01 18:47:13.860154
ob6ecut3b2u71og3rpy5lilo	eojz0g9mgyr3u0qgc1yqsv1l	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
p08c4286u9pqztlzejahsvts	eojz0g9mgyr3u0qgc1yqsv1l	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
a49mltarcdrnnnmks0izhu3v	eojz0g9mgyr3u0qgc1yqsv1l	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
aufg666s6d7cne05rkebh9o8	eojz0g9mgyr3u0qgc1yqsv1l	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
fs0xxxxcrkxxf6l9d1y4yfq8	vt6fj7ctdm2qmj58y1ziqq04	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
zmgf15wxcbotmju32zijpd05	vt6fj7ctdm2qmj58y1ziqq04	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
dijaob3hk7mobg2b5voaiak7	vt6fj7ctdm2qmj58y1ziqq04	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
e4iz4g8rflh9b65dnkhu28to	dl2x50o6sen6117zvsymel5w	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
znieci5lf8chuopgiao7jn8c	dl2x50o6sen6117zvsymel5w	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
ijixse2z8mh99944u5pl1ykd	dl2x50o6sen6117zvsymel5w	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 18:55:03.803107	2026-01-01 18:55:03.803107
fqg330ip1sh3tbct0lnwin9o	esw671lch23ftx5ct2kj8i5k	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
vfdbumng872eualbc5ky0x89	esw671lch23ftx5ct2kj8i5k	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
q2xi5fuyxjupo9et8854fgdh	esw671lch23ftx5ct2kj8i5k	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
lofpjkbbcwt6yfefz7u9hnsj	esw671lch23ftx5ct2kj8i5k	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
wnnm0zwgndtm3vf8l7pecmdh	e9sab0ur0x73xboipzjra2sx	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
fdml5608qd3htwo0rfiq1n93	e9sab0ur0x73xboipzjra2sx	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
stffkdk3pkz953o687v75xzo	e9sab0ur0x73xboipzjra2sx	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
worqhqpilgv93wdqebttl6la	zg1lpg9uy06jynshq83hl2ah	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
a6mcyvfgrcxe87v8qt6nitrs	zg1lpg9uy06jynshq83hl2ah	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
q090dewyz8guo4vd9g3aqws4	zg1lpg9uy06jynshq83hl2ah	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 18:57:18.75352	2026-01-01 18:57:18.75352
wi7ipw7a2e962ghi2o91dl9s	dzke58b1oci3px3fsvt328vy	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
wkoeb15otkoag99foutqbl19	dzke58b1oci3px3fsvt328vy	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
wjse6xwfyigw630wjhg97k9i	dzke58b1oci3px3fsvt328vy	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
fp2hucuy3k77h0dsccvh3r5e	dzke58b1oci3px3fsvt328vy	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
yvxoz0a6aohro39ghtmcnev1	t68ga1bdi0er6cyob3gjx180	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
rbz0evg2c4r95mqmbvwavqak	t68ga1bdi0er6cyob3gjx180	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
occh1iyia6zp19gfuumfn8s6	t68ga1bdi0er6cyob3gjx180	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
bvq3x94i71og6lpf2hqsvkmt	dei01b26au2xa4cvg7kqs033	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
qzralxkb4ic67mlhs8597hno	dei01b26au2xa4cvg7kqs033	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
xvhgn9otcm3wlp1ht7eqvcuc	dei01b26au2xa4cvg7kqs033	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 19:08:32.727098	2026-01-01 19:08:32.727098
qape3wle3rt9juzpi8d3cxsc	zcyqku8j7yykey2zeu3xdcvh	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
au0go3028p5bbzzpjsvmx0js	zcyqku8j7yykey2zeu3xdcvh	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
xlgct2e0beemly9v5f98latt	zcyqku8j7yykey2zeu3xdcvh	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
kz3k6uld54f2uwtlghedlkka	zcyqku8j7yykey2zeu3xdcvh	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
antosyppdxkwdfr4xd9pawk7	q4yys4k1are3s5jxkge3o435	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
yzv7z5de8qqz86ja8dmued6m	q4yys4k1are3s5jxkge3o435	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
w9gzi7322qyqyj4zxotfnhkm	q4yys4k1are3s5jxkge3o435	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
lk3svm3dvnes1pgtbuy27on1	oj8tiroog8ozjo9am6ew839k	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
w1w11e3n13pf5dgsbg3v98dr	oj8tiroog8ozjo9am6ew839k	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
f1k4dxkt8bdhb0kvhfc9asho	oj8tiroog8ozjo9am6ew839k	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 19:15:36.914664	2026-01-01 19:15:36.914664
crto27cgvztif76ic9w6et1q	knh0c73pjsaspsk1o8plhci0	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
qw3t6x4ilwl1vdznqte5fmzf	knh0c73pjsaspsk1o8plhci0	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
ru4ynkbu1ezmwym8k2tfeh69	knh0c73pjsaspsk1o8plhci0	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
tmj0uoxn2ulagphrr1q6elej	knh0c73pjsaspsk1o8plhci0	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
to9h4a7vkvnbebmhcytoszy3	q05zhh31tnaes40ygeyiaexc	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
om1wah00oxxaknhm39b0bu2y	q05zhh31tnaes40ygeyiaexc	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
mig12vhnl9ht9kw38o7nhqyo	q05zhh31tnaes40ygeyiaexc	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
kc1lt0dj7zibgal7e1xyyfag	qnvjfjea45vt9okevx17tuz1	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
ax8ithmtel6tat4udbr9cc2c	qnvjfjea45vt9okevx17tuz1	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
ls13czvf6d0zr3yu8ic55dyk	qnvjfjea45vt9okevx17tuz1	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 19:19:50.185321	2026-01-01 19:19:50.185321
wfhk868eulkvxolvet2zawz3	w0ntel7rg43qy9uv87qw1e52	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
aoqyugekq6xigp1mmi1jzmt1	w0ntel7rg43qy9uv87qw1e52	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
qlalajooxlvio5p04inqflmd	w0ntel7rg43qy9uv87qw1e52	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
ietb00vqx8bygv77vtvyx5u9	w0ntel7rg43qy9uv87qw1e52	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
ssgjds0mu6hqo9itmx10z3v1	nbc97jtab1aymdidhvbwbrhg	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
lk8a33r1rrqhcbnght2tn20q	nbc97jtab1aymdidhvbwbrhg	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
ydhrmupixlnf3329ttve3ru1	nbc97jtab1aymdidhvbwbrhg	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
joljyttclprw9ya5fnr9asgz	wix0i25gx1tnc7wq24du1exn	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
qnrx6mqvz5db9xphl8u96jbs	wix0i25gx1tnc7wq24du1exn	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
i3sm3erxque3cklfmdvd1jzd	wix0i25gx1tnc7wq24du1exn	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-01 19:30:42.026245	2026-01-01 19:30:42.026245
ifpgz77iwe7sm90sm46a0zav	jo0qza2ieyl8c1vkedbpp6zr	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
thfgqgrkdmgfw2z982krpoa8	jo0qza2ieyl8c1vkedbpp6zr	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
wkfw729xb5cbauviddxmhdm7	jo0qza2ieyl8c1vkedbpp6zr	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
i51ku7z03cgx3qcsphgeo6vs	jo0qza2ieyl8c1vkedbpp6zr	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
rirmqud7bqufdfb3f052yc39	g29vrq0a6pj6fxhm6v8r11li	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
yjtcp4n943asff7jzhc94quc	g29vrq0a6pj6fxhm6v8r11li	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
bdl64gj9jwp3d187pxd8wrag	g29vrq0a6pj6fxhm6v8r11li	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
b9m2zxz6kmgw690xvaz2fz8k	cpoyvtgi1rao42w4r30ksmns	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
n64u9gr5u7td97m8pupcn76o	cpoyvtgi1rao42w4r30ksmns	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
rqke10wg8jfp0saz8byzxuzr	cpoyvtgi1rao42w4r30ksmns	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-03 10:31:16.01748	2026-01-03 10:31:16.01748
p0622uno4yv3szec8zso455b	o8t906ewjktc9ft0mirjnu5x	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
cx0lsxuv8drtq2rxkdefywoe	o8t906ewjktc9ft0mirjnu5x	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
ws02ljvchsj3bcd6pl1be41i	o8t906ewjktc9ft0mirjnu5x	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
wjybjalq98e2uhd5xnunmjbt	o8t906ewjktc9ft0mirjnu5x	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
f03xbnoxzwxezx5t0cj7yoti	hxm1kvnlw8oz8byq3vtzqy0o	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
b4x3vu5wmscy3ne55kqj1wqy	hxm1kvnlw8oz8byq3vtzqy0o	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
q1vpxz9bpxe8gyn8cgwm5mi2	hxm1kvnlw8oz8byq3vtzqy0o	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
oksa4qhu7ziebtlaeudp7vfn	quslsrlrvbm3jmtir3mp257u	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
xg7m12b3tm6evoo0w6ow44e2	quslsrlrvbm3jmtir3mp257u	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
js4pyb8pedsy74hqns1d4ysc	quslsrlrvbm3jmtir3mp257u	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-03 12:41:53.421906	2026-01-03 12:41:53.421906
wuoe4v4cf83d2dsa7h10wj5b	m4ldq6rulnp01yblby192u9c	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
umkusx3xekrmn5f3g6re5nzq	m4ldq6rulnp01yblby192u9c	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
bxoz2tinohlvuqu6kviz87lz	m4ldq6rulnp01yblby192u9c	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
iuhok4svx07kc4ps60xv6s6c	m4ldq6rulnp01yblby192u9c	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
qwr98e5ziqji75toq4vjkwcw	e36x2v5fd2dv33easysjz8fk	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
thpwa6tl0tevrc4h30b1rz3h	e36x2v5fd2dv33easysjz8fk	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
z844n5tcr6wz3x6eufjxl65a	e36x2v5fd2dv33easysjz8fk	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
ghsse6k5bwzxzvkcdpe1i81t	pe85kgh7nnxq4ukx57gjna5f	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
k022rc9pg19xnocw4665vc0n	pe85kgh7nnxq4ukx57gjna5f	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
dhtjpjmu248okwz2aexukv4i	pe85kgh7nnxq4ukx57gjna5f	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-03 14:01:06.418189	2026-01-03 14:01:06.418189
rx39m2l8ikkfrlgdb8m3smi4	yblis5kst1lmd1ey00log8lw	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
nnfig5bx5a83296kdhdyu5zd	yblis5kst1lmd1ey00log8lw	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
s2xcjiai975vu1uuqaeq3pnl	yblis5kst1lmd1ey00log8lw	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
pv08knppn2aab7bdx7nqbo8m	yblis5kst1lmd1ey00log8lw	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
txe6ijl7ejqzmbecdtf6c3zm	n57mb5wkg2tmxtv1x4ufloy8	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
v7ynzx6in3g85ajhxx37d9iy	n57mb5wkg2tmxtv1x4ufloy8	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
nyulnzbu6bqtmnnf1ek48o1i	n57mb5wkg2tmxtv1x4ufloy8	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
njleau3svg0pa2r6rteickpd	ly389n459zo8sbtbrcs0x0hw	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
idf4uqgtou3lfah3om8xi0k7	ly389n459zo8sbtbrcs0x0hw	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
f1zaf7xdxexp0k3f82zxb0kd	ly389n459zo8sbtbrcs0x0hw	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-04 15:52:48.143211	2026-01-04 15:52:48.143211
uqxv85wg72gayrw7gtw96uv6	lh8ualqa2v0kdonomqyr6waw	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
dftzxczd2as0n0r888tqrgwo	lh8ualqa2v0kdonomqyr6waw	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
d9je9wnf4npgtrugk05cq2cv	lh8ualqa2v0kdonomqyr6waw	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
yjrff6lmzhgpgls6wv37lo9y	lh8ualqa2v0kdonomqyr6waw	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
ql3icd9ift64vqu6km24ot6q	apeddff8voykv87wss22pnn8	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
btbtt94nujq8umw2go8vwosc	apeddff8voykv87wss22pnn8	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
lodx24hp1mpj9cqbducageit	apeddff8voykv87wss22pnn8	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
awnenh1hqn10h1mcmgzrvgwu	xlwbtrq8g6fjchq82foyb7rc	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
et672crrztjr5z0qwb5o5hdt	xlwbtrq8g6fjchq82foyb7rc	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
j5dz739urz5wrsgoxhiq8ddu	xlwbtrq8g6fjchq82foyb7rc	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-06 14:46:11.650922	2026-01-06 14:46:11.650922
kih5f0mc71iyrzkzxziv26d0	odyrgcon92cytpkctjczyn0z	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
mkjaa74tjrnt42xluv9k1yw4	odyrgcon92cytpkctjczyn0z	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
fg230t2as9xx0u873mhy0uk2	odyrgcon92cytpkctjczyn0z	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
gsse5aifk2q5183d3q0yw6hq	odyrgcon92cytpkctjczyn0z	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
qmdgpbw9ojxblc0rsiagts5v	jsbf9cn7gnc0vyufyj5w0zyv	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
lb2rfyqwc40grc2xkb06h8kt	jsbf9cn7gnc0vyufyj5w0zyv	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
u6yrv2vttimein6e3bc2u0o9	jsbf9cn7gnc0vyufyj5w0zyv	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
phhsryii7p81oy9d66gd91mb	qxbpagov8vp5io78bp1zlmzi	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
gakdjpnjw18m0zh5ckv7phlr	qxbpagov8vp5io78bp1zlmzi	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
y54h6s3ybf6vqoy0qxwxy3au	qxbpagov8vp5io78bp1zlmzi	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-06 16:34:24.447363	2026-01-06 16:34:24.447363
rogmjsrclzc5eqjxh1avsehs	nmzhhs903bypzfm1qrm06qg7	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
j1o5s9bvb56xd5y7wjxo0qmv	nmzhhs903bypzfm1qrm06qg7	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
pdd3qufjss4wo7fp2obtp0la	nmzhhs903bypzfm1qrm06qg7	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
r1i7oxip2u6dy8q35etpkelw	nmzhhs903bypzfm1qrm06qg7	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
vfjs679qqjdzlixthza406ys	i9bc0706rbxy4kh7tsfi8r74	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
ffgltbbifvskj0ww4iht8pvn	i9bc0706rbxy4kh7tsfi8r74	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
ox8zo60t67zf9fd9g98eci0r	i9bc0706rbxy4kh7tsfi8r74	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
cht535dfnwqq3h62v5frdq9v	ft34m0twc3eev8ifts119b7t	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
wqtiinvqkuhnfyw1n9tdjhe9	ft34m0twc3eev8ifts119b7t	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
d8nfvxmv3erbv4feufozs7yt	ft34m0twc3eev8ifts119b7t	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-09 02:08:35.635904	2026-01-09 02:08:35.635904
qvigwg64w6elgixyo4etc0la	bmz6bfc4wtnifmdh7ueo4ptt	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
zqnyz7irbm3u3y058vnu1x21	bmz6bfc4wtnifmdh7ueo4ptt	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
msp52ycm6z6966l6q9vuo8u0	bmz6bfc4wtnifmdh7ueo4ptt	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
hh5wii4pgqtmeedtsg16qo4a	bmz6bfc4wtnifmdh7ueo4ptt	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
ul8ee1lj9o7oavfpuusyandn	tlzogdlb4bydswi90w3yaftx	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
o476vfmfdj5dsj2rfobmo69q	tlzogdlb4bydswi90w3yaftx	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
xjc4bj7fnoobxmti21nnej2q	tlzogdlb4bydswi90w3yaftx	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
hm3p0fxilu3dznbyfwlxsopb	g6ldheqmviukn78mbp32lmgz	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
o9o5je7xicg28338egrbqsog	g6ldheqmviukn78mbp32lmgz	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
eabxyqrxh47bjmqzpchq9dtp	g6ldheqmviukn78mbp32lmgz	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-10 16:49:45.186596	2026-01-10 16:49:45.186596
u2n4vfkjrgjsib7ps5ortv33	tz7bhaj01uex3o1h3wocg8ge	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
j4zpn4fv8p6azju4ohjngvir	tz7bhaj01uex3o1h3wocg8ge	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
pemchil4xhf29ucopu3r9j4f	tz7bhaj01uex3o1h3wocg8ge	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
yn422kfclorsu54xs3vq14ap	tz7bhaj01uex3o1h3wocg8ge	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
dt19u2jpp7lf6fq5ba01q2jy	edrir05yzot8dpomrlevakw8	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
vydzkbu5d9w0hknwzrqb6xxz	edrir05yzot8dpomrlevakw8	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
co6qeh4wd6udrap60rgpiibw	edrir05yzot8dpomrlevakw8	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
d13l2pqldx92xdbmq4ihq6gs	r4thk9l4qp33hmo8hk91c5ep	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
iap9mvwoe31nibgnxxd24r2f	r4thk9l4qp33hmo8hk91c5ep	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
gke1gycpischl7cs5s66kazs	r4thk9l4qp33hmo8hk91c5ep	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-10 16:51:20.802796	2026-01-10 16:51:20.802796
os6dw98nu5f0ihnjqi13bx31	u3ylor52lf0kn3shqvt8weea	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
ssiit1bmeijesqccurwovls1	u3ylor52lf0kn3shqvt8weea	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
gdq14jb1xjdrvmmp9fy1qxje	u3ylor52lf0kn3shqvt8weea	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
o1fs6hwi5sakjzkbsrd2dk3x	u3ylor52lf0kn3shqvt8weea	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
j1zzr8ix6mg776oxaeb7ufs2	n3ikggul8dhwv0bil3rdhabz	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
bc9n8hg5yl726wewzb7nv12v	n3ikggul8dhwv0bil3rdhabz	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
k0lv6zv49gro3xpzktaew8zi	n3ikggul8dhwv0bil3rdhabz	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
b7ure77cwdoa8y1cbb1fxj2e	xbrc5cdxtkypf6reppnp1d82	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
e524ybtzt57oq4o1i6gwle5r	xbrc5cdxtkypf6reppnp1d82	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
pfdacb211oaezrvzn90rax5o	xbrc5cdxtkypf6reppnp1d82	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-16 07:16:27.711011	2026-01-16 07:16:27.711011
a3nwatv1jnw1b11wqfsbaeoi	uzzajyx0rywy096qc5oz3oa1	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
v27ds0edm2ipq4hpmz98cw6w	uzzajyx0rywy096qc5oz3oa1	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
po6hw0iw8lusqzy1ow4me4ln	uzzajyx0rywy096qc5oz3oa1	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
aokdtz6oxgz66lg3wzno9rp3	uzzajyx0rywy096qc5oz3oa1	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
now79g0qc4xs9bt6w1261hfs	dh5kg2n3kzy0cyhmuyedkrqo	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
hb8rrj4k35vbescpeboevwai	dh5kg2n3kzy0cyhmuyedkrqo	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
j3l0dmb0xtewpz22tfax604z	dh5kg2n3kzy0cyhmuyedkrqo	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
igwwvdu6eujmy1e6lhlplvyy	gfmwdsq7zacwrq3yk7asff6v	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
yc2u9xdn1w6wl1p68n3swldu	gfmwdsq7zacwrq3yk7asff6v	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
g7nyhop6rmm6l0ziady6et39	gfmwdsq7zacwrq3yk7asff6v	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-16 11:16:58.770352	2026-01-16 11:16:58.770352
ftf0v8irxfiunrwo7lbu26oz	k2t1ttpvhe378v3qismkcrr7	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
xqc5ygdjqvb503jn9u18o2tt	k2t1ttpvhe378v3qismkcrr7	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
s7mm8mlius0dxusf3r1iuqqt	k2t1ttpvhe378v3qismkcrr7	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
fou97j4d5r394uk6fuvqqq9e	k2t1ttpvhe378v3qismkcrr7	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
uma6twlxgp3uvb6zew4gsixx	useva20gl2ta9d29sue8jfg8	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
p8vladkc0zg6pdpmapo6tcrb	useva20gl2ta9d29sue8jfg8	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
qxhled65mzqdinpvj3wx2k11	useva20gl2ta9d29sue8jfg8	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
xoc05f8ts01sgt2q6rq1gi75	o2vaghumdqxx28o89eift8ve	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
fl39560g5y1op7qshxbtfemz	o2vaghumdqxx28o89eift8ve	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
uy7j1vcnjo2bizw3xyswttiq	o2vaghumdqxx28o89eift8ve	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-16 11:17:17.566645	2026-01-16 11:17:17.566645
baogcrhvqipfpcxqk92rdv2f	lbd7fp06n8uxkf7290xxahpp	Berapa hasil dari 5 + 7?	mcq	[{"id": "1", "text": "10"}, {"id": "2", "text": "12"}, {"id": "3", "text": "15"}, {"id": "4", "text": "13"}]	["2"]	10	1	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
jjoo995dwd0zfz5gamvfyxeb	lbd7fp06n8uxkf7290xxahpp	Berapa hasil dari 9 × 8?	mcq	[{"id": "1", "text": "72"}, {"id": "2", "text": "81"}, {"id": "3", "text": "64"}, {"id": "4", "text": "56"}]	["1"]	10	2	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
wmzk857k88ci4lrgxjofcbvv	lbd7fp06n8uxkf7290xxahpp	Jika x + 5 = 12, berapa nilai x?	input	\N	["7"]	15	3	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
llrkemg8hw72783uwoacqhc1	lbd7fp06n8uxkf7290xxahpp	Pilih bilangan prima: (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "2"}, {"id": "2", "text": "4"}, {"id": "3", "text": "7"}, {"id": "4", "text": "9"}, {"id": "5", "text": "11"}]	["1", "3", "5"]	20	4	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
sz3w0y5lo1nhkzquhom36bvf	sbuxrslic417ynkh3sl3i7dr	Apa ibu kota Indonesia?	mcq	[{"id": "1", "text": "Bandung"}, {"id": "2", "text": "Jakarta"}, {"id": "3", "text": "Surabaya"}, {"id": "4", "text": "Medan"}]	["2"]	10	1	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
s7mjs3r8w4ult1xg4sxjw9i7	sbuxrslic417ynkh3sl3i7dr	Kata baku yang benar adalah... (pilih semua yang benar)	multiple_select	[{"id": "1", "text": "Apotek"}, {"id": "2", "text": "Apotik"}, {"id": "3", "text": "Sistem"}, {"id": "4", "text": "Sistim"}]	["1", "3"]	15	2	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
hgbpjyv29giqklkkpgzqley1	sbuxrslic417ynkh3sl3i7dr	Sebutkan salah satu contoh kata majemuk:	input	\N	["rumah sakit", "kamar mandi", "meja tulis"]	10	3	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
xmylqejvrknfivuswe7e614d	de7j75djhyixnvmf3hcebrqu	Planet terbesar di tata surya adalah?	mcq	[{"id": "1", "text": "Mars"}, {"id": "2", "text": "Jupiter"}, {"id": "3", "text": "Saturnus"}, {"id": "4", "text": "Bumi"}]	["2"]	5	1	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
p8jj4h5tnsu1rji1w9fk8xyg	de7j75djhyixnvmf3hcebrqu	H2O adalah rumus kimia untuk?	mcq	[{"id": "1", "text": "Oksigen"}, {"id": "2", "text": "Hidrogen"}, {"id": "3", "text": "Air"}, {"id": "4", "text": "Karbon Dioksida"}]	["3"]	5	2	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
zmq1vi8b77m2t1o2go02yqtj	de7j75djhyixnvmf3hcebrqu	Berapa jumlah kromosom manusia normal?	input	\N	["46"]	10	3	2026-01-16 11:26:58.555417	2026-01-16 11:26:58.555417
\.


--
-- Data for Name: ujian_answers; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.ujian_answers (id, attempt_id, question_id, user_answer, is_correct, points_earned, answered_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict q3VY9f92rH6vBsSDhPU5s1rvuNyf0SAIHTFQQ2lZfHCcmsXWrfmcdaIjViwcKAg

