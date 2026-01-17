--
-- PostgreSQL database dump
--

\restrict 6UUuojC4Oq09dPEWHzWEjAm9MM7X0KJlHfP7Sf7rtZEQBXCkLuPmINx5MKnTV2S

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
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'cash',
    'bank',
    'e_wallet',
    'credit_card',
    'investment'
);


--
-- Name: attempt_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attempt_status AS ENUM (
    'in_progress',
    'completed',
    'abandoned'
);


--
-- Name: budget_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.budget_period AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly'
);


--
-- Name: category_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.category_type AS ENUM (
    'income',
    'expense'
);


--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_channel AS ENUM (
    'inApp',
    'email',
    'whatsapp'
);


--
-- Name: notification_preference_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_preference_category AS ENUM (
    'global',
    'general',
    'system'
);


--
-- Name: notification_preference_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_preference_source AS ENUM (
    'default',
    'user',
    'override'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'unread',
    'read'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'informational',
    'approval'
);


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'mcq',
    'multiple_select',
    'input'
);


--
-- Name: saving_log_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.saving_log_type AS ENUM (
    'add',
    'withdraw'
);


--
-- Name: transaction_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_source AS ENUM (
    'manual',
    'import'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'income',
    'expense',
    'transfer'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: job_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_executions (
    id text NOT NULL,
    job_id text NOT NULL,
    attempt_number integer NOT NULL,
    status character varying(20) NOT NULL,
    started_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone,
    error_message text,
    worker_id character varying(50),
    execution_time_ms integer,
    memory_usage_mb integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: job_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_schedules (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    job_type character varying(100) NOT NULL,
    cron_expression character varying(100) NOT NULL,
    payload json DEFAULT '{}'::json NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    last_run_at timestamp without time zone,
    next_run_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by text
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id text NOT NULL,
    type character varying(100) NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    payload json NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    failed_at timestamp without time zone,
    retry_count integer DEFAULT 0 NOT NULL,
    max_retries integer DEFAULT 3 NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by text,
    worker_id character varying(50),
    timeout_seconds integer DEFAULT 300,
    tags json DEFAULT '[]'::json
);


--
-- Name: kv_store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kv_store (
    key text NOT NULL,
    value text,
    expires_at timestamp with time zone
);


--
-- Name: microsoft_admin_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.microsoft_admin_tokens (
    id character varying(255) NOT NULL,
    token_type character varying(50) NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    scope text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    name character varying(255) NOT NULL,
    type public.account_type NOT NULL,
    balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    currency character varying(3) DEFAULT 'IDR'::character varying NOT NULL,
    icon character varying(50),
    color character varying(7),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_budgets (
    id text NOT NULL,
    user_id text NOT NULL,
    category_id text,
    amount numeric(15,2) NOT NULL,
    period public.budget_period NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_categories (
    id text NOT NULL,
    user_id text NOT NULL,
    name character varying(255) NOT NULL,
    type public.category_type NOT NULL,
    icon character varying(50),
    color character varying(7),
    parent_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_saving_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_saving_logs (
    id text NOT NULL,
    saving_id text NOT NULL,
    amount numeric(15,2) NOT NULL,
    type public.saving_log_type NOT NULL,
    note text,
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_savings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_savings (
    id text NOT NULL,
    user_id text NOT NULL,
    name character varying(255) NOT NULL,
    target_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    current_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    target_date date,
    icon character varying(50),
    color character varying(7),
    is_achieved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: money_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.money_transactions (
    id text NOT NULL,
    user_id text NOT NULL,
    account_id text NOT NULL,
    category_id text,
    type public.transaction_type NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    to_account_id text,
    source public.transaction_source DEFAULT 'manual'::public.transaction_source NOT NULL,
    tags jsonb,
    attachment_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    wa_message_id text,
    labels jsonb
);


--
-- Name: notification_action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_action_logs (
    id character varying(25) NOT NULL,
    notification_id character varying(25) NOT NULL,
    action_key character varying(50) NOT NULL,
    acted_by text NOT NULL,
    comment text,
    acted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_actions (
    id character varying(25) NOT NULL,
    notification_id character varying(25) NOT NULL,
    action_key character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    requires_comment boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_channel_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_channel_overrides (
    id character varying(25) NOT NULL,
    category public.notification_preference_category NOT NULL,
    channel public.notification_channel NOT NULL,
    enforced boolean DEFAULT true NOT NULL,
    reason text,
    effective_from timestamp with time zone DEFAULT now() NOT NULL,
    effective_to timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying(25) NOT NULL,
    user_id text NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    status public.notification_status DEFAULT 'unread'::public.notification_status NOT NULL,
    category character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    expires_at timestamp with time zone,
    group_key date
);


--
-- Name: oauth_google; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_google (
    id character varying(25) NOT NULL,
    user_id text,
    provider_id character varying(255) NOT NULL,
    name text,
    given_name text,
    family_name text,
    access_token text,
    refresh_token text,
    locale character varying(255),
    email text,
    profile_picture_url text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: oauth_microsoft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_microsoft (
    id character varying(25) NOT NULL,
    user_id text,
    provider_id character varying(255) NOT NULL,
    access_token text,
    refresh_token text,
    email text,
    display_name text,
    given_name text,
    surname text,
    user_principal_name text,
    job_title text,
    mobile_phone text,
    office_location text,
    preferred_language character varying(255),
    profile_picture_url text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: permissions_to_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions_to_roles (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


--
-- Name: permissions_to_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions_to_users (
    "userId" text NOT NULL,
    "permissionId" text NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    revoked_at timestamp without time zone
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: roles_to_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles_to_users (
    "userId" text NOT NULL,
    "roleId" text NOT NULL
);


--
-- Name: ujian; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ujian (
    id text NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    max_questions integer DEFAULT 10 NOT NULL,
    shuffle_questions boolean DEFAULT false,
    shuffle_answers boolean DEFAULT false,
    practice_mode boolean DEFAULT false,
    allow_resubmit boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ujian_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ujian_answers (
    id text NOT NULL,
    attempt_id text NOT NULL,
    question_id text NOT NULL,
    user_answer jsonb NOT NULL,
    is_correct boolean,
    points_earned integer DEFAULT 0,
    answered_at timestamp without time zone DEFAULT now()
);


--
-- Name: ujian_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ujian_attempts (
    id text NOT NULL,
    ujian_id text NOT NULL,
    user_id text NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    score numeric(5,2),
    total_points integer,
    status public.attempt_status DEFAULT 'in_progress'::public.attempt_status NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ujian_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ujian_questions (
    id text NOT NULL,
    ujian_id text NOT NULL,
    question_text text NOT NULL,
    question_type public.question_type NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    points integer DEFAULT 1,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preferences (
    id character varying(25) NOT NULL,
    user_id text NOT NULL,
    category public.notification_preference_category NOT NULL,
    channel public.notification_channel NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    delivery_window jsonb DEFAULT 'null'::jsonb,
    source public.notification_preference_source DEFAULT 'default'::public.notification_preference_source NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    username character varying NOT NULL,
    email character varying,
    password text,
    is_enable boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    phone_number character varying(20),
    theme_mode character varying(20) DEFAULT 'light'::character varying,
    color_scheme character varying(20) DEFAULT 'default'::character varying
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	3b0a6b6c480f0f4acc451660cf55b8bcc7958635fcdfa502e8853818b2455166	1729879032778
2	16dff175e29d77a060337e6199e33cf514e5808d8a227200b1517b545fc88e23	1737872577339
3	91522e91c668394776b464bf2c754fecedde7c333d634c418a50e3d1579cfcb9	1742659637912
4	a816161e0a703d88e1f8077348a6db4921c5a6aaa1d7512123f8db0f348aac9d	1742661720623
5	a86f3b8fb19c1820fc671566ca59515d66d3115b5a1c32775891d4729e9d9d32	1742705362695
6	bd8f34944be1b0cd9ca6eb2ddf6fcabd189941eb36c9d799bfcbed12ba371cd1	1743189474898
7	ee7c7bb2d46b9df28922dd0cb4563963b795d7a6937ee97df7f80890c25765be	1750698667277
8	5169bbce0fce2073cb8febaf5b8c7de783f9dc3269815c1ee8a124cb3e6859df	1750744533085
9	c258aded4540768c37f3c53ac182525d5c5fbeb43abdfbf01b29ca2b67497281	1751000726598
10	48b5bfb6de1ea8c597575e1e3c730ce321ac21a062d551d222885b51a07d54b6	1751787595599
11	7a860865e4ba4057cd0d00b82ad690d737603deb6fccac954edcf8da4b364fd7	1760450436474
12	2f010f089079abdea0aedc80df77819e8eef3d50aeeacef1804b2956c8335776	1760854964178
13	1821423afc24cae4bd2ecb3d7ecd318c61c6a5cf5c9add0a4727f75415afdb11	1762077440627
14	c7e2d785f77b119a83288f6105ab1288c1b6f89d395985db61c2c8674e43bedf	1762079247506
15	b28225c6e3bb7211771a0cefe1dafd2773ea14655d61820038a7b5067f4504ae	1762164220753
16	09c69f994af35cfe8c439e2070418f14b0f8eeb6d1b468a6a5550467389a9ffd	1763017420977
17	4e61f577ceed8a9e4afec3f8dbe8190474cab6cf4a7407d597e81f6845757fd1	1763811188146
18	e9066bee744df1ae2b42a3514fe91190e067f55313f0fda03a6d418625c9bc08	1766380117689
19	26e96f28528404d2a210ddb3253c81d0667e08a123a5c6d9f6d391cbbf7d8a32	1766950018560
20	0149317e664860cd316891a1271992c90de8208ff772a2cf2fad29947e9f7fff	1767206069858
21	1f44c3a0fcd20c7e88955b8adf5450eb92a1e1ee9fadd899b1667771d2c73f9e	1767286677200
22	745c00f183013bbd420394897c79bf9d43d6d0f0f002ef007110541c7a6cc5bd	1767463635079
23	634d743358ca3b30a749f5b2b5bfd1d6656eb0762d4d002a261162a0d701100a	1768549994404
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, key, value, created_at, updated_at) FROM stdin;
f4tmvrv5sy4b8wnkobmchvxb	login.usernameAndPassword.enabled	true	2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
kun5ij9j77vcddxzmgnore2m	oauth.google.enabled	false	2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
v4ta2yvn9tf9p79s6oqb61qu	oauth.google.clientId		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
cpbiqunlwak338k414gxymzm	oauth.google.clientSecret		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
mijdcmbp63w5w1x94sg8k3g0	oauth.microsoft.enabled	false	2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
xh1caqb77b6aiytz7q2vb31w	oauth.microsoft.clientId		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
hsxm4ftv5ln97259hhlyvl62	oauth.microsoft.clientSecret		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
zyx9c4slwn3bktfydrkl2epg	oauth.microsoft.redirectUri		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
mcd0yljd3pyaa7m4ahw2nnut	oauth.microsoft.tenantId		2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
yx8w8l8w047vik844njx9nzw	observability.enabled	true	2025-12-28 18:53:21.634604	2025-12-28 18:53:21.634604
\.


--
-- Data for Name: job_executions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_executions (id, job_id, attempt_number, status, started_at, completed_at, error_message, worker_id, execution_time_ms, memory_usage_mb, created_at) FROM stdin;
\.


--
-- Data for Name: job_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_schedules (id, name, job_type, cron_expression, payload, is_active, timezone, last_run_at, next_run_at, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, type, priority, payload, status, scheduled_at, started_at, completed_at, failed_at, retry_count, max_retries, error_message, created_at, updated_at, created_by, worker_id, timeout_seconds, tags) FROM stdin;
\.


--
-- Data for Name: kv_store; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kv_store (key, value, expires_at) FROM stdin;
\.


--
-- Data for Name: microsoft_admin_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.microsoft_admin_tokens (id, token_type, access_token, refresh_token, scope, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: money_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_accounts (id, user_id, name, type, balance, currency, icon, color, is_active, created_at, updated_at) FROM stdin;
odqiqvhgzxtosku3mk7mnitn	po2vul7bqa4l1gtpcf0c0pdn	Kas	cash	2263535.00	IDR	\N	\N	t	2026-01-01 18:55:45.32041	2026-01-16 11:30:51.396
\.


--
-- Data for Name: money_budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_budgets (id, user_id, category_id, amount, period, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: money_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_categories (id, user_id, name, type, icon, color, parent_id, is_active, created_at, updated_at) FROM stdin;
gqan0tdtu70vxq5ktl9ifdie	po2vul7bqa4l1gtpcf0c0pdn	Gaji	income	💼	#10b981	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vmoogmmzih1m759d92uaikv2	po2vul7bqa4l1gtpcf0c0pdn	Freelance	income	💻	#10b981	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
q3ucepp0m40n7mw5druzcdql	po2vul7bqa4l1gtpcf0c0pdn	Penjualan	income	🛒	#10b981	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
iw9wk1bocuuoncgyemsm4w7t	po2vul7bqa4l1gtpcf0c0pdn	Sangu	income	👨‍👩‍👧	#34d399	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
luct74dft3vwxhioaxpfa5wn	po2vul7bqa4l1gtpcf0c0pdn	Hadiah	income	🎁	#34d399	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vnf522cqmn1h4eyovdjakfeo	po2vul7bqa4l1gtpcf0c0pdn	Paylater	income	💳	#6ee7b7	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
xijou0ag2ku4xtapno398rau	po2vul7bqa4l1gtpcf0c0pdn	Bonus	income	🎯	#a7f3d0	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
aabi0m8970cffk4uvfqk4j4h	po2vul7bqa4l1gtpcf0c0pdn	Dividen	income	📊	#a7f3d0	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vb1ikd69icnr1nnc45yz0az5	po2vul7bqa4l1gtpcf0c0pdn	Bunga Bank	income	🏦	#a7f3d0	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
kvgro8drbx9ot18nmkjza7ca	po2vul7bqa4l1gtpcf0c0pdn	Cashback	income	💰	#a7f3d0	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
nxkyb0xsmom23crfuaf4jy2s	po2vul7bqa4l1gtpcf0c0pdn	Makanan dan Minuman	expense	🍔	#ef4444	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
uddiz2wfe43h337yrhrvnd2r	po2vul7bqa4l1gtpcf0c0pdn	Bahan Mentah dan Kebutuhan Dapur	expense	🥬	#ef4444	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
d5329tkcqhbqz5a5v1vy4exx	po2vul7bqa4l1gtpcf0c0pdn	Kebutuhan Rumah	expense	🏠	#ef4444	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vxkmlzoumr6gosozymtu2j13	po2vul7bqa4l1gtpcf0c0pdn	Pakaian	expense	👕	#f87171	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
it8ka5hkphd0tqimccz1gadd	po2vul7bqa4l1gtpcf0c0pdn	Skincare, Makeup, dan Perawatan Diri	expense	💄	#f87171	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
djt95hn4ga4ee05pprlinb47	po2vul7bqa4l1gtpcf0c0pdn	Obat	expense	💊	#f87171	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
l4msnwrdcurwly8no8hzzkmk	po2vul7bqa4l1gtpcf0c0pdn	Kebutuhan Anak	expense	👶	#fb923c	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
wwor6f87nxy7g9g1lgp9ka5o	po2vul7bqa4l1gtpcf0c0pdn	Kebutuhan Hewan	expense	🐾	#fb923c	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
da5fc6v4vzt7z2dx8tjzgns1	po2vul7bqa4l1gtpcf0c0pdn	Kontrakan	expense	🏘️	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
g0cvavqmuvj3hykjwvufncvp	po2vul7bqa4l1gtpcf0c0pdn	Listrik	expense	⚡	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
nshe61swpisu52h1i3ly1lj1	po2vul7bqa4l1gtpcf0c0pdn	Air/PDAM	expense	💧	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
kzf305fsv1nknbc1h5of9u3b	po2vul7bqa4l1gtpcf0c0pdn	WiFi	expense	📶	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
sikqvbwfa9edvjmga2ns9jzn	po2vul7bqa4l1gtpcf0c0pdn	Sampah	expense	🗑️	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
bu85i4jssh2woj38vmzcmt3v	po2vul7bqa4l1gtpcf0c0pdn	Perbaikan Rumah	expense	🔧	#f59e0b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
zqv2jhf4lifea9v9v5yzqev9	po2vul7bqa4l1gtpcf0c0pdn	Tiket Transportasi	expense	🚌	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
u4libtwy356k6u47140tlb0d	po2vul7bqa4l1gtpcf0c0pdn	Ojek Online	expense	🏍️	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
c9s823pr17y8fql3vovbadp7	po2vul7bqa4l1gtpcf0c0pdn	Bensin	expense	⛽	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
a9z22344lu18lmk6tvutk88a	po2vul7bqa4l1gtpcf0c0pdn	Parkir	expense	🅿️	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
p7dpj4349sstl4dvhxour45y	po2vul7bqa4l1gtpcf0c0pdn	Rental	expense	🚗	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
f16cj4i5jsli6euq41vnlfmo	po2vul7bqa4l1gtpcf0c0pdn	Perbaikan dan Perawatan Kendaraan	expense	🔩	#fbbf24	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
ubb166m0ep1aa7fnyezho4ps	po2vul7bqa4l1gtpcf0c0pdn	Biaya Kesehatan	expense	🏥	#84cc16	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vjy61xbhrhtbdn34e02vbd0x	po2vul7bqa4l1gtpcf0c0pdn	Olahraga	expense	💪	#84cc16	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
kyazsb4ugvupwk27dlropatl	po2vul7bqa4l1gtpcf0c0pdn	Biaya Pendidikan	expense	📚	#22c55e	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vo9hajvnogcncwp934lxvvca	po2vul7bqa4l1gtpcf0c0pdn	Print dan ATK	expense	📝	#22c55e	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
t7ko2jkua6aq0z6esstuki3w	po2vul7bqa4l1gtpcf0c0pdn	Hiburan/Rekreasi	expense	🎬	#06b6d4	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
uziu8urz63v6z0cbdorpburx	po2vul7bqa4l1gtpcf0c0pdn	Hotel	expense	🏨	#06b6d4	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
ny0agomo7th4wd8a1cgr9wn9	po2vul7bqa4l1gtpcf0c0pdn	Acara	expense	🎉	#06b6d4	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
n77yblnncvdn5dg1gg015ol3	po2vul7bqa4l1gtpcf0c0pdn	Hadiah	expense	🎁	#06b6d4	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
pah4exfovbproa0octiteo5p	po2vul7bqa4l1gtpcf0c0pdn	Elektronik	expense	📱	#3b82f6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
xnrtjcw77l5wyrcooz3ac6lg	po2vul7bqa4l1gtpcf0c0pdn	Kuota, Pulsa, dan Pascabayar	expense	📞	#3b82f6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
k1pirmf2iwfckxb0lk1sukss	po2vul7bqa4l1gtpcf0c0pdn	Subscription	expense	📺	#3b82f6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
lz970e70my5g8o9qdftun57e	po2vul7bqa4l1gtpcf0c0pdn	Game dan Aplikasi	expense	🎮	#3b82f6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
ws7ufvnu9bxv2pic21a6ctan	po2vul7bqa4l1gtpcf0c0pdn	Layanan Langganan	expense	📦	#3b82f6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
bklplqru30q2x22fxxkaj19h	po2vul7bqa4l1gtpcf0c0pdn	Laundry	expense	👔	#8b5cf6	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
xgwnudspbsko4vq563b7ghjb	po2vul7bqa4l1gtpcf0c0pdn	Sedekah	expense	🤲	#a855f7	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
x31ja68qf8eyxlylyg2t8ulf	po2vul7bqa4l1gtpcf0c0pdn	Zakat	expense	🕌	#a855f7	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
onvvfeagbebfcdc2q4xqfs5f	po2vul7bqa4l1gtpcf0c0pdn	Tabungan	expense	💰	#ec4899	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
cklqjjgcnikcc8d4yova5icm	po2vul7bqa4l1gtpcf0c0pdn	Investasi	expense	📈	#ec4899	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
qumaq6udt2efftgfjsep1789	po2vul7bqa4l1gtpcf0c0pdn	Emas dan Perhiasan	expense	💎	#ec4899	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
vrs2k4bollhaghwul6oy5dgl	po2vul7bqa4l1gtpcf0c0pdn	Cicilan	expense	💳	#ec4899	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
xy6yfnwiwcm9bx1jvuue2vl6	po2vul7bqa4l1gtpcf0c0pdn	Biaya Administrasi dan Denda	expense	📄	#f43f5e	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
qv63qxsiyyvwchjexl193485	po2vul7bqa4l1gtpcf0c0pdn	Asuransi	expense	🛡️	#f43f5e	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
gm007d58hlfvzk220nmw737c	po2vul7bqa4l1gtpcf0c0pdn	Pajak	expense	🏛️	#f43f5e	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
mq0hdbrixn5u2per48bpqikj	po2vul7bqa4l1gtpcf0c0pdn	Lainnya	expense	📋	#64748b	\N	t	2026-01-01 18:47:13.887512	2026-01-01 18:47:13.887512
g4xmqmbyhe8kgcnpv7fbygw9	po2vul7bqa4l1gtpcf0c0pdn	Refund	income	↩️	#78716c	\N	t	2026-01-01 18:47:13.887512	2026-01-16 07:20:02.509
dekkbigfbhapkt0mlxc6wt3y	po2vul7bqa4l1gtpcf0c0pdn	Hutang	income	🤝	#ef4444	\N	t	2026-01-01 18:47:13.887512	2026-01-16 07:20:26.344
\.


--
-- Data for Name: money_saving_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_saving_logs (id, saving_id, amount, type, note, date, created_at) FROM stdin;
\.


--
-- Data for Name: money_savings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_savings (id, user_id, name, target_amount, current_amount, target_date, icon, color, is_achieved, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: money_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.money_transactions (id, user_id, account_id, category_id, type, amount, description, date, to_account_id, source, tags, attachment_url, created_at, updated_at, wa_message_id, labels) FROM stdin;
b2w31mr4811yf9jvn9d7kl3a	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	100000.00	Buwuh pakde sugeng	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:09:08.176202	2026-01-01 19:09:08.176202	false_120363266486054443@g.us_3EB0C33A48A94F5883EDE1_87716586856657@lid	\N
demvokkflmhi7ofjdx2t91w7	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	30000.00	Pringles	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:15:58.698378	2026-01-01 19:15:58.698378	false_120363266486054443@g.us_3EB0B3618E0515E3BAD24E_87716586856657@lid	\N
ugw41000wz3zm0cbnmi255pe	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20000.00	Regal	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:15:58.722387	2026-01-01 19:15:58.722387	false_120363266486054443@g.us_3EB0B3618E0515E3BAD24E_87716586856657@lid	\N
j54i9t69cyva0c2yjzwufkkd	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10000.00	Milo	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:15:58.732339	2026-01-01 19:15:58.732339	false_120363266486054443@g.us_3EB0B3618E0515E3BAD24E_87716586856657@lid	\N
wmpiqd9kzqqez5y1cx2xw9k5	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	c9s823pr17y8fql3vovbadp7	expense	34000.00	Pertamax	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:20:52.716948	2026-01-01 19:20:52.716948	false_120363266486054443@g.us_3EB01B37C3C29E04C29EEF_87716586856657@lid	\N
y5dnsfq8cy69y69df2soaihf	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9000.00	Nu Matcha Latte	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:37.650763	2026-01-01 19:21:37.650763	false_120363266486054443@g.us_3EB0556CF98CC9263CC278_87716586856657@lid	\N
diw7pk572blojyxe5n8ddqph	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25000.00	Point Coffee Matcha Latte	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:37.6739	2026-01-01 19:21:37.6739	false_120363266486054443@g.us_3EB0556CF98CC9263CC278_87716586856657@lid	\N
a1b4umsmynazfvzjnroe9tgy	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	5900.00	Bebelac UHT 105mL	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:37.684223	2026-01-01 19:21:37.684223	false_120363266486054443@g.us_3EB0556CF98CC9263CC278_87716586856657@lid	\N
uaupfsd70avxgma64sd6oydw	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	4000.00	Greenfield UHT F Crm 105	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:37.691002	2026-01-01 19:21:37.691002	false_120363266486054443@g.us_3EB0556CF98CC9263CC278_87716586856657@lid	\N
hrj9ts395ccx46afrxvt177d	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	14100.00	Cavendish Pisang Whl	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:37.7007	2026-01-01 19:21:37.7007	false_120363266486054443@g.us_3EB0556CF98CC9263CC278_87716586856657@lid	\N
hxatvfspd6khcct3wq5m7ool	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g0cvavqmuvj3hykjwvufncvp	expense	473144.00	Listrik	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:21:59.167428	2026-01-01 19:21:59.167428	false_120363266486054443@g.us_3EB0D826FF1C196160C9F1_87716586856657@lid	\N
sx40zy972h8gfnk8ipa8m6ph	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	kzf305fsv1nknbc1h5of9u3b	expense	274950.00	WiFi	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:22:38.492594	2026-01-01 19:22:38.492594	false_120363266486054443@g.us_3EB0808876546D12CDB3F7_87716586856657@lid	\N
m6yyo42j3il40ja1znwn39js	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	k1pirmf2iwfckxb0lk1sukss	expense	61039.00	YouTube Music	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:22:38.503957	2026-01-01 19:22:38.503957	false_120363266486054443@g.us_3EB0808876546D12CDB3F7_87716586856657@lid	\N
q9pjt7ls51yuzuaxx1q8ig3t	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xnrtjcw77l5wyrcooz3ac6lg	expense	102120.00	XL	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:22:38.512333	2026-01-01 19:22:38.512333	false_120363266486054443@g.us_3EB0808876546D12CDB3F7_87716586856657@lid	\N
fb789xset9qx5mzqsga29uwz	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xnrtjcw77l5wyrcooz3ac6lg	expense	35000.00	Kuota Firda	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:22:38.515838	2026-01-01 19:22:38.515838	false_120363266486054443@g.us_3EB0808876546D12CDB3F7_87716586856657@lid	\N
vhe707t0xs7ufe9if80xukmf	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vrs2k4bollhaghwul6oy5dgl	expense	1790205.00	Cicilan Gopay Januari	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:23:15.069634	2026-01-01 19:23:15.069634	false_120363266486054443@g.us_3EB07BE393E1D8DFF1424C_87716586856657@lid	\N
i51hyrpzwy3yj2ixymlj8r12	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vrs2k4bollhaghwul6oy5dgl	expense	1620000.00	Cicilan Seabank Januari	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:23:15.076593	2026-01-01 19:23:15.076593	false_120363266486054443@g.us_3EB07BE393E1D8DFF1424C_87716586856657@lid	\N
thoucjohjk5siu4c7doxo4pg	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vrs2k4bollhaghwul6oy5dgl	expense	188000.00	Cicilan Spinjam	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:23:30.635908	2026-01-01 19:23:30.635908	false_120363266486054443@g.us_3EB06EA1F2DFD6E124F5FB_87716586856657@lid	\N
i2eudypooh24ejyrf92w6vui	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	f16cj4i5jsli6euq41vnlfmo	expense	800000.00	Servis motor	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:23:41.37549	2026-01-01 19:23:41.37549	false_120363266486054443@g.us_3EB0F8F48A3E7104E1FC07_87716586856657@lid	\N
muypeb9w37n84wt7acfl3eok	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	onvvfeagbebfcdc2q4xqfs5f	expense	212000.00	Tabungan Alma	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:24:05.499426	2026-01-01 19:24:05.499426	false_120363266486054443@g.us_3EB0C500F82696861D0281_87716586856657@lid	\N
ph9t4tv6vzsbpq2t9ie6gtu8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	k1pirmf2iwfckxb0lk1sukss	expense	706654.00	GitHub	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:26:28.949093	2026-01-01 19:26:28.949093	false_120363266486054443@g.us_3EB0C2FB0D3C97E0768541_87716586856657@lid	\N
vwyncz2fo7o0mxdotvkza60k	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	5000.00	Parkir santera	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 19:16:16.87521	2026-01-02 04:12:39.674	false_120363266486054443@g.us_3EB02A739E1B646846C104_87716586856657@lid	\N
y7ft9fxu6dsd7gv7shedbjis	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20000.00	Ayam Hotways	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 07:28:06.816223	2026-01-02 07:28:06.816223	false_120363266486054443@g.us_AC304FE8F94CF2E4CB3DF00E537E7BA6_61727723016403@lid	\N
wnsupnc4f39n2dk9w0bdwdri	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	15000.00	Kentang Goreng	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 07:28:06.838194	2026-01-02 07:28:06.838194	false_120363266486054443@g.us_AC304FE8F94CF2E4CB3DF00E537E7BA6_61727723016403@lid	\N
vvk28in30exx1kcd4s8wk024	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6000.00	Air Mineral	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 07:28:06.849028	2026-01-02 07:28:06.849028	false_120363266486054443@g.us_AC304FE8F94CF2E4CB3DF00E537E7BA6_61727723016403@lid	\N
j04i7ciihet1w0ksajf8pfho	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	kyazsb4ugvupwk27dlropatl	expense	6939583.00	Retake CHFI	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 08:29:15.929237	2026-01-02 08:29:15.929237	false_120363266486054443@g.us_3EB039B2B44EB234CD5CC8_87716586856657@lid	\N
zq5ats85bspof1aomev2itz4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Hotways	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 09:50:18.522301	2026-01-02 09:50:18.522301	false_120363266486054443@g.us_AC8D709F55616857E7A79614A11736B9_87716586856657@lid	\N
zce61quvxzbp86aprjerauyn	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	24000.00	Ayam Hotways	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 09:50:37.392933	2026-01-02 09:50:37.392933	false_120363266486054443@g.us_ACF77E6050FFC284315527F8BD3F3D4D_87716586856657@lid	\N
okpv9dpqym6infrzb9n6bbo0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	2500.00	Admin transfer	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 09:50:44.275661	2026-01-02 09:50:44.275661	false_120363266486054443@g.us_ACA5ED3289C37E4171BD68B2C90FA569_87716586856657@lid	\N
x66mfsaet55r8zsqqa7ey8p9	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25000.00	Ubi bakar Cilembu	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:05:32.418941	2026-01-02 11:05:32.418941	false_120363266486054443@g.us_AC0FE3D9FCD934B39DC2F912E11A3491_87716586856657@lid	\N
cburpzv69oknpv3u8aanxxry	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	19380.00	Komodo Baby Wipes Blue 50s	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.006848	2026-01-02 11:39:29.006848	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
ofkxivf3qgwhyu89f0q8yf21	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	16500.00	Gaga Mie Gepeng Goreng Aylda 75gr	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.025618	2026-01-02 11:39:29.025618	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
zzuhe2j3ehhapksljj451po3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	17690.00	Sunlight Lime Pouch 2x640g	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.033878	2026-01-02 11:39:29.033878	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
w7ey92gf2dbb91h7h2a0goks	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	5700.00	Indomie Soto Lamongan 80gr	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.043909	2026-01-02 11:39:29.043909	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
vusx8ek8fx6jxjlpdym19air	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	5980.00	Indomie Goreng Kriuuk Pedas 90gr	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.051185	2026-01-02 11:39:29.051185	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
b0uet4p4cleixelcf7tk9bpa	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10800.00	Gaga Mie Gepeng Goreng Ayam 75gr	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.061024	2026-01-02 11:39:29.061024	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
azm6dzxaoe4u04v4oeqnbuvb	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	5990.00	Kecap Sawi Manis 140 ml	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.067533	2026-01-02 11:39:29.067533	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
ai5f8vqpaq9qb3lltu8o28l3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	19300.00	Mayasi Bawang 65g	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.078448	2026-01-02 11:39:29.078448	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
d99a20olv5iwc2jfk8nbvuh1	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9650.00	Mayasi Koro Keju 65g	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.086533	2026-01-02 11:39:29.086533	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
aacjtnmae8xpowmn40c2yw7a	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	19500.00	NS Strawberry Mika Kotak	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.092713	2026-01-02 11:39:29.092713	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
t2t8w1naj5d3tuledt98h3er	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	18000.00	Sedayu Wedang Uwuh 45g	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.099143	2026-01-02 11:39:29.099143	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
p170wikt81tee7ryh1r1hagb	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	14490.00	TJ Joybee Multivit Original 100ml	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.106673	2026-01-02 11:39:29.106673	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
ypgago9htsmcrt8kmnhtt3t0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9400.00	Tropicana Slim Almond Drink Choco 190 ml	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.112874	2026-01-02 11:39:29.112874	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
nh92a68ec33247pi22l5cqdq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	5780.00	Sedaap Mie Goreng A.Krispi 84gr	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.119424	2026-01-02 11:39:29.119424	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
fxe7ozjumctvof81cn9wsgf0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6250.00	Ja Kue Lumpur Cendera	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.126033	2026-01-02 11:39:29.126033	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
lqawxtg0yb3u5ssp52etv8tn	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	400.00	Plastic Bag	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 11:39:29.134505	2026-01-02 11:39:29.134505	false_120363266486054443@g.us_AC1ED39F2D540F600540F784DEAA0183_87716586856657@lid	\N
l59zn0cnvrtqmy7okq8cap11	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	29900.00	365 Telur Omega3	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.126016	2026-01-02 12:28:35.126016	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
ee1alc4ttwz678bz59fai7dc	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	18000.00	Sari Roti	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.143834	2026-01-02 12:28:35.143834	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
w2qh2eeig0lw6xdbgavyhks9	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	33900.00	365 Facial Tissue	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.152875	2026-01-02 12:28:35.152875	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
im3nu21q1siph1fmhsgs3sdx	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	18900.00	Molto Gentle	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.16111	2026-01-02 12:28:35.16111	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
s64lrc3yxpod5yeqc2mlcn98	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	8900.00	Promina Pasta	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.170442	2026-01-02 12:28:35.170442	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
c5a07ue52vt29emr32f8jh5h	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6290.00	Frisian UHT CKT22	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.181019	2026-01-02 12:28:35.181019	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
dlperm76hlw0okkgcw5j5un4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6290.00	Frisian UHT STW22	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.191573	2026-01-02 12:28:35.191573	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
qo4ju9cywwt1qgv2op5smte3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	27900.00	Rinso Detergent Pure	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.199241	2026-01-02 12:28:35.199241	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
mx3efbxtszeit8w0zkxo6r9m	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	200.00	Plastic Shop Bag	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:28:35.208194	2026-01-02 12:28:35.208194	false_120363266486054443@g.us_3EB0C656079FDE84A20F53_87716586856657@lid	\N
e0wn77fly9ae8xdi7ag3c9i8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Cybermall	2026-01-02 00:00:00	\N	import	\N	\N	2026-01-02 12:55:55.836969	2026-01-02 12:55:55.836969	false_120363266486054443@g.us_3EB046B1C7E5F61D86D7D5_87716586856657@lid	\N
ginucsjv7alih2cx3zlsdr32	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	u4libtwy356k6u47140tlb0d	expense	21000.00	GoCar	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:32:58.72674	2026-01-03 10:32:58.72674	false_120363266486054443@g.us_AC92AA1AACE4AC61D9B3AE461CFF7E54_87716586856657@lid	\N
bt7rubtqri31gpocao478nz4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	mq0hdbrixn5u2per48bpqikj	expense	1000.00	Toilet	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:33:16.4937	2026-01-03 10:33:16.4937	false_120363266486054443@g.us_AC432D9C1FBB8F44B364B7E4919BF224_87716586856657@lid	\N
plwrjfixczpevx9sqmsdcnd6	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20000.00	Jus alpukat	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:33:16.609268	2026-01-03 10:33:16.609268	false_120363266486054443@g.us_ACF8BF79DD0B23A6FD205EDE09D92355_87716586856657@lid	\N
j8ch9pmovuvjdqyuqf1zqvqu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9500.00	Kue Lumpur	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:33:53.870466	2026-01-03 10:33:53.870466	false_120363266486054443@g.us_AC39124AA784EE22508E7D7CA11B5F7C_87716586856657@lid	\N
es2z0ao6ckfvncteiwio1mox	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	19000.00	Bikang Ambon	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:33:53.887518	2026-01-03 10:33:53.887518	false_120363266486054443@g.us_AC39124AA784EE22508E7D7CA11B5F7C_87716586856657@lid	\N
ntp6fahogml1t1e5hl80cnho	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	20000.00	Kitchen soap dispenser bt-76#	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:35:04.323098	2026-01-03 10:35:04.323098	false_120363266486054443@g.us_ACCFF9D1781566823552D914F1C7C9C0_87716586856657@lid	\N
xx95pc039ekptdfiz8x2ytb2	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vxkmlzoumr6gosozymtu2j13	expense	8500.00	Jaw clip	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 10:35:04.337857	2026-01-03 10:35:04.337857	false_120363266486054443@g.us_ACCFF9D1781566823552D914F1C7C9C0_87716586856657@lid	\N
nk0ulf2sffi969l6ipozrj6l	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	46000.00	Wingstop	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 11:25:39.330321	2026-01-03 11:25:39.330321	false_120363266486054443@g.us_AC08D9EE33A05D89A4F4F3C0402113D1_87716586856657@lid	\N
hcbaqu2dgfa0yembip56hh55	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir mog	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 12:24:38.141228	2026-01-03 12:24:38.141228	false_120363266486054443@g.us_3EB0B48DF0A4212722A372_87716586856657@lid	\N
yin43yw0ex3y5nr4d9xbn281	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Mas Rian	2026-01-03 00:00:00	\N	import	\N	\N	2026-01-03 12:24:44.594784	2026-01-03 12:24:44.594784	false_120363266486054443@g.us_3EB0ED4732C752614D58DE_87716586856657@lid	\N
e2amviihy7g8qh0ksdcl566k	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	3000.00	Parkir CFD	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 03:06:10.295481	2026-01-04 03:06:10.295481	false_120363266486054443@g.us_AC4E7C8F4CB864DAF844F23E689D9EAB_87716586856657@lid	\N
olwgqm0lxzbkbak9smtshuds	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	91300.00	Nasi kulit	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 04:00:28.69875	2026-01-04 04:00:28.69875	false_120363266486054443@g.us_AC32D7D9C567279AA537CCB5439CEEAA_87716586856657@lid	\N
ajl27lwucxssekwhdr41fmlq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	50000.00	Nyangoni Napis	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 05:54:00.898982	2026-01-04 05:54:39.577	false_120363266486054443@g.us_AC6D276B0AB4F607FD52FD3F83E11EBC_61727723016403@lid	\N
t9tv0ie9c5pgf4c8qgli1kge	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25500.00	Nashville lv1	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 12:30:34.126004	2026-01-04 12:30:34.126004	false_120363266486054443@g.us_AC3FF4872EC475A2FAEAF2D6F3CBE8E1_87716586856657@lid	\N
e5dlvcck3v4n13d0guc22o95	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	24500.00	Oyi 2 Reguler	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 12:30:34.145044	2026-01-04 12:30:34.145044	false_120363266486054443@g.us_AC3FF4872EC475A2FAEAF2D6F3CBE8E1_87716586856657@lid	\N
o42bg9w429qgkqjs162c3l3m	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	13000.00	French Fries	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 12:30:34.154348	2026-01-04 12:30:34.154348	false_120363266486054443@g.us_AC3FF4872EC475A2FAEAF2D6F3CBE8E1_87716586856657@lid	\N
qui588lqrrpq3r2lbdenndir	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	it8ka5hkphd0tqimccz1gadd	expense	20000.00	Pijet	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 14:14:19.152973	2026-01-04 14:14:19.152973	false_120363266486054443@g.us_ACBB47DB7E639EBECF9A4CE7F89D025B_87716586856657@lid	\N
e8u68u90zxz2zkxlmk5jqieo	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir mog	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:37:57.126839	2026-01-04 15:37:57.126839	false_120363266486054443@g.us_3EB04C2219A3984BFB5FF7_87716586856657@lid	\N
z38j1gaqauiprhhsc0i7nixh	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	pah4exfovbproa0octiteo5p	expense	40800.00	ABC Alkaline AA-LR6/4	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.56225	2026-01-04 15:40:14.56225	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
g6dd83f1c85m9jm88x2g80ql	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6900.00	KK JPNS MATCHA 200	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.57964	2026-01-04 15:40:14.57964	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
bfrv8lyqtg7oxc8qqtsrx8fs	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	7900.00	Ultra Plain Slilm250M	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.587398	2026-01-04 15:40:14.587398	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
e8qcw5hd6horx0xlgu7d387l	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	20800.00	K/A GL.Aren SM 10'S	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.595214	2026-01-04 15:40:14.595214	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
h0dmm770njdcypr8foh7fkyj	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	djt95hn4ga4ee05pprlinb47	expense	22700.00	ANTANGIN JRG 5X15ML	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.610733	2026-01-04 15:40:14.610733	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
ws3xgy6oa1o118dggwlldbk3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	200.00	IDM KTG PLSTK 1W SDG	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.617316	2026-01-04 15:40:14.617316	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
xgnf6u8t6el27k8to9fdv0nr	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	27900.00	KIT MTR CHN.LUBE 110	2026-01-04 00:00:00	\N	import	\N	\N	2026-01-04 15:40:14.602451	2026-01-16 07:24:06.806	false_120363266486054443@g.us_3EB0A4718EF317067078DD_87716586856657@lid	\N
gc9yszuuqwvae9e43s29x6zq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	50000.00	Buwuh pakde sugeng	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 18:58:26.574195	2026-01-02 04:13:07.748	false_120363266486054443@g.us_3EB0FBFF871E49EBA002E6_87716586856657@lid	\N
bkoc80ua70pbyurmmecbnexs	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	300000.00	Ngasih Ayah	2026-01-01 00:00:00	\N	import	\N	\N	2026-01-01 18:55:45.400474	2026-01-02 04:13:21.76	false_120363266486054443@g.us_3EB0D5A6215AD6F667F5C2_87716586856657@lid	\N
dy80kfipvkk9cuc2v2j8p8b2	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	gqan0tdtu70vxq5ktl9ifdie	income	7000000.00	Gaji	2025-12-31 16:57:00	\N	import	\N	\N	2026-01-04 15:57:45.539628	2026-01-04 15:58:30.389	false_120363266486054443@g.us_3EB0000C73C306F151A2D4_87716586856657@lid	\N
xftrl73is799fcnxp0zh0jvf	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xijou0ag2ku4xtapno398rau	income	11131172.00	Insentif	2025-12-31 16:57:00	\N	import	\N	\N	2026-01-04 15:57:45.560788	2026-01-04 15:58:41.366	false_120363266486054443@g.us_3EB0000C73C306F151A2D4_87716586856657@lid	\N
tegqlyq70bvnoqwsomv0dfyl	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vrs2k4bollhaghwul6oy5dgl	expense	1000000.00	Cicilan NADI	2025-12-31 16:00:00	\N	import	\N	\N	2026-01-04 16:00:02.527341	2026-01-04 16:00:28.127	false_120363266486054443@g.us_3EB0A6DDFE953F58A6AB09_87716586856657@lid	\N
t2eq85p3ishzwufwpshx8yba	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	4000.00	Aqua	2026-01-05 04:17:59.179	\N	import	\N	\N	2026-01-05 04:17:59.180892	2026-01-05 04:17:59.180892	false_120363266486054443@g.us_3EB0CC8ED7B59200B68132_87716586856657@lid	\N
hei3dtrde9qy2rmqnkyi54p5	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25000.00	Nasi ayam telor	2026-01-05 05:21:12.443	\N	import	\N	\N	2026-01-05 05:21:12.444974	2026-01-05 05:21:12.444974	false_120363266486054443@g.us_AC53F7968757403A6D5F9B6A8CA7CC73_87716586856657@lid	\N
zr5ihh40dk2bvrv4a6cdit5n	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	7000.00	Es teh	2026-01-05 05:48:31.632	\N	import	\N	\N	2026-01-05 05:48:31.633724	2026-01-05 05:48:31.633724	false_120363266486054443@g.us_3EB0605DC31A975DC5651E_87716586856657@lid	\N
ryqgddoza9gtf28tjge201xu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir	2026-01-05 05:48:50.47	\N	import	\N	\N	2026-01-05 05:48:50.471085	2026-01-05 05:48:50.471085	false_120363266486054443@g.us_3EB032C06A1A77A3BB0A85_87716586856657@lid	\N
vc6fv66y3zo41utp9pznw2so	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Bayarin parkir hendra	2026-01-05 05:48:50.47	\N	import	\N	\N	2026-01-05 05:48:50.490975	2026-01-05 05:48:50.490975	false_120363266486054443@g.us_3EB032C06A1A77A3BB0A85_87716586856657@lid	\N
ix2zry8tuzzldd0ujsd45ds1	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	c9s823pr17y8fql3vovbadp7	expense	32000.00	Pertamax	2026-01-05 11:36:27.966	\N	import	\N	\N	2026-01-05 11:36:27.968418	2026-01-05 11:36:27.968418	false_120363266486054443@g.us_AC11F9C26896B996176A8383E5CC05F8_61727723016403@lid	\N
m44990qs8tco6r1vqvg4idbi	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Dieng	2026-01-05 12:59:34.333	\N	import	\N	\N	2026-01-05 12:59:34.334616	2026-01-05 12:59:34.334616	false_120363266486054443@g.us_ACDD3559182F5504A3956F4C8E9EBB22_87716586856657@lid	\N
q5ndes7mmxapcdjrs1yqjfwt	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	22000.00	Black Latte Ice	2026-01-05 13:00:31.634	\N	import	\N	\N	2026-01-05 13:00:31.636375	2026-01-05 13:00:31.636375	false_120363266486054443@g.us_ACF44254AABB2071791C438212B9CFB7_87716586856657@lid	\N
g3paapf2bg9y0tbtnel9j2dl	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	22000.00	Black Pink Latte Ice	2026-01-05 13:00:31.634	\N	import	\N	\N	2026-01-05 13:00:31.655046	2026-01-05 13:00:31.655046	false_120363266486054443@g.us_ACF44254AABB2071791C438212B9CFB7_87716586856657@lid	\N
ir67bm7icc8f7rx4m9k0z7ei	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25000.00	Chicken Steak Panini	2026-01-05 13:00:31.634	\N	import	\N	\N	2026-01-05 13:00:31.662948	2026-01-05 13:00:31.662948	false_120363266486054443@g.us_ACF44254AABB2071791C438212B9CFB7_87716586856657@lid	\N
veqvdb5b3xbsnyf7ya2jtjpi	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	18000.00	Jasmine Tea Ice	2026-01-05 13:00:31.634	\N	import	\N	\N	2026-01-05 13:00:31.670753	2026-01-05 13:00:31.670753	false_120363266486054443@g.us_ACF44254AABB2071791C438212B9CFB7_87716586856657@lid	\N
ywz0opu3tlq9wscmi921qg4e	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	136550.00	Burgershot buat Nanda	2026-01-05 13:01:31.608	\N	import	\N	\N	2026-01-05 13:01:31.609914	2026-01-05 13:01:31.609914	false_120363266486054443@g.us_ACF7AD08184B83DCDD3866CA61D1326D_87716586856657@lid	\N
f26a4wt2pjunpys2ux66ls1y	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	n77yblnncvdn5dg1gg015ol3	expense	200000.00	Uang duka buat Nanda	2026-01-05 17:40:22.985	\N	import	\N	\N	2026-01-05 17:40:22.986876	2026-01-05 17:40:22.986876	false_120363266486054443@g.us_3EB084C15BE0FFEC095596_61727723016403@lid	\N
m14kzvvy9yqugynlg5mp76qp	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	38000.00	2 paket fc 3 (dada)	2026-01-06 13:06:59.139	\N	import	\N	\N	2026-01-06 13:06:59.141527	2026-01-06 13:06:59.141527	false_120363266486054443@g.us_AC46BCFCFBEF73CB6FABA266BB4D8013_87716586856657@lid	\N
s1ot2f7vlxtles2ui1ejrbru	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	23000.00	1 paket ag 3 (paha atas)	2026-01-06 13:06:59.139	\N	import	\N	\N	2026-01-06 13:06:59.160053	2026-01-06 13:06:59.160053	false_120363266486054443@g.us_AC46BCFCFBEF73CB6FABA266BB4D8013_87716586856657@lid	\N
pexe3rym9v2cembzxjn4dqif	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	12000.00	1 lele krispi	2026-01-06 13:06:59.139	\N	import	\N	\N	2026-01-06 13:06:59.168159	2026-01-06 13:06:59.168159	false_120363266486054443@g.us_AC46BCFCFBEF73CB6FABA266BB4D8013_87716586856657@lid	\N
e3fgn8tbfcq08mg7ore9xfzs	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	7000.00	1 cah kangkung	2026-01-06 13:06:59.139	\N	import	\N	\N	2026-01-06 13:06:59.183204	2026-01-06 13:06:59.183204	false_120363266486054443@g.us_AC46BCFCFBEF73CB6FABA266BB4D8013_87716586856657@lid	\N
lqe5322itwj7iqi2stlrstj7	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g4xmqmbyhe8kgcnpv7fbygw9	income	79000.00	Refund hadiah untuk Nanda dari Ilham	2026-01-06 13:07:49.267	\N	import	\N	\N	2026-01-06 13:07:49.268249	2026-01-06 13:07:49.268249	false_120363266486054443@g.us_ACDF005A5F6BD5916114BEA6B3E711B2_87716586856657@lid	\N
n3aipvwp1p56079n0cnz07tu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	8000.00	Pocari swt 350mL	2026-01-06 13:09:04.39	\N	import	\N	\N	2026-01-06 13:09:04.391671	2026-01-06 13:09:04.391671	false_120363266486054443@g.us_AC26E3F13777A1B387F3095F69B59684_87716586856657@lid	\N
pkxi3zz4miit6ykazlzlrqi7	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	7500.00	FF FP CKT 225mL	2026-01-06 13:09:04.39	\N	import	\N	\N	2026-01-06 13:09:04.40941	2026-01-06 13:09:04.40941	false_120363266486054443@g.us_AC26E3F13777A1B387F3095F69B59684_87716586856657@lid	\N
iz1a31l60wjnzv5a8dcga0j8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	7000.00	Roti	2026-01-06 13:37:13.273	\N	import	\N	\N	2026-01-06 13:37:13.275154	2026-01-06 13:37:13.275154	false_120363266486054443@g.us_AC10288297707CBB9A420CE7A1B4BC68_87716586856657@lid	\N
bb29it5pz9h6cbb4ewmxb95f	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	49000.00	Ayam Hotways	2026-01-07 05:23:53.369	\N	import	\N	\N	2026-01-07 05:23:53.371188	2026-01-07 05:23:53.371188	false_120363266486054443@g.us_3EB09CB3454A8D9506F2E5_87716586856657@lid	\N
p9cndfbnolg50an6i9ql3lwk	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6000.00	Air Mineral	2026-01-07 05:23:53.369	\N	import	\N	\N	2026-01-07 05:23:53.381385	2026-01-07 05:23:53.381385	false_120363266486054443@g.us_3EB09CB3454A8D9506F2E5_87716586856657@lid	\N
fd96szmdirjw36p8vsdtabqe	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Hotways	2026-01-07 05:28:12.581	\N	import	\N	\N	2026-01-07 05:28:12.581725	2026-01-07 05:28:12.581725	false_120363266486054443@g.us_AC6A63CD5C83616DA0E830009AC90912_61727723016403@lid	\N
cghsyjafhqs5omrniy47kdl3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	27500.00	Kentang	2026-01-07 13:47:27.566	\N	import	\N	\N	2026-01-07 13:47:27.568172	2026-01-07 13:47:27.568172	false_120363266486054443@g.us_ACFBE98B98FA86BE2644E85ACE0749C9_87716586856657@lid	\N
i113z9vu20hfyacg5ntheuic	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	14000.00	Air mineral	2026-01-07 13:47:27.566	\N	import	\N	\N	2026-01-07 13:47:27.574679	2026-01-07 13:47:27.574679	false_120363266486054443@g.us_ACFBE98B98FA86BE2644E85ACE0749C9_87716586856657@lid	\N
sib3ce6ligxop44v65od555l	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	27500.00	Ayam bk	2026-01-07 14:53:57.058	\N	import	\N	\N	2026-01-07 14:53:57.059298	2026-01-07 14:53:57.059298	false_120363266486054443@g.us_AC6B1C56947E55280519BE22C218DB39_87716586856657@lid	\N
vawxtmtakuahgvndbho0q4rr	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	18501.00	Mekdi	2026-01-07 14:54:21.932	\N	import	\N	\N	2026-01-07 14:54:21.934077	2026-01-07 14:54:21.934077	false_120363266486054443@g.us_AC711811992895C8A6BC66280CE78BF2_87716586856657@lid	\N
ygw26hg5vo8e92uq17lwo3a8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Mekdi	2026-01-07 16:16:03.338	\N	import	\N	\N	2026-01-07 16:16:03.33994	2026-01-07 16:16:03.33994	false_120363266486054443@g.us_3EB08289F76244AD5668D9_87716586856657@lid	\N
jo3fklfunlzjq0cofvgpj9ix	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	1000.00	Admin transfer BCA ke LinkAja	2026-01-07 16:20:59.606	\N	import	\N	\N	2026-01-07 16:20:59.607339	2026-01-07 16:20:59.607339	false_120363266486054443@g.us_AC370F42C37782E7D6EBA32A809DE36B_61727723016403@lid	\N
q6y2v623iyk6z0bfq2z5o5ay	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	kyazsb4ugvupwk27dlropatl	expense	400000.00	Daftar S2 TelU Chesa	2026-01-07 16:21:38.022	\N	import	\N	\N	2026-01-07 16:21:38.023729	2026-01-07 16:21:38.023729	false_120363266486054443@g.us_ACA81A9880FF3745BC0E6DB304FF8449_61727723016403@lid	\N
l5792j4n0ehh6lfkvfzc0c3m	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	49400.00	Nasi kuning (gofud, musium brawijaya)	2026-01-08 05:59:13.323	\N	import	\N	\N	2026-01-08 05:59:13.324241	2026-01-08 05:59:13.324241	false_120363266486054443@g.us_AC3D52984BEE5500E48179154CEB7D92_61727723016403@lid	\N
st43sapssdx3myhywodth71y	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	50000.00	2 Bebek Purnama + 2 Es Jeruk	2026-01-08 11:00:25.681	\N	import	\N	\N	2026-01-08 11:00:25.683436	2026-01-08 11:00:25.683436	false_120363266486054443@g.us_3EB0A2938422FCE2484B25_87716586856657@lid	\N
f8fol4qkrfy75e00xiyvj6w6	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	mq0hdbrixn5u2per48bpqikj	expense	1000.00	Toilet	2026-01-06 13:41:18.915	\N	import	\N	\N	2026-01-06 13:41:18.916398	2026-01-08 11:01:45.817	false_120363266486054443@g.us_ACD695F9CD61E7282BAF6205AD7B83EC_87716586856657@lid	\N
z5uh51bubk2g0mc0qv1fy79n	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vxkmlzoumr6gosozymtu2j13	expense	150000.00	Sewa jas	2026-01-08 12:14:41.173	\N	import	\N	\N	2026-01-08 12:14:41.174662	2026-01-08 12:14:41.174662	false_120363266486054443@g.us_AC340657AB189A36AC8DB72089E719B0_61727723016403@lid	\N
mh1hgcyukeamsu2t5hgc7adi	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	c9s823pr17y8fql3vovbadp7	expense	35000.00	Bensin	2026-01-08 14:06:39.901	\N	import	\N	\N	2026-01-08 14:06:39.902891	2026-01-08 14:06:39.902891	false_120363266486054443@g.us_AC95227BF26F1D3360DED32779C7B458_87716586856657@lid	\N
ulsj60ewg89nbkh5r2emz3me	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6000.00	Kopi Ireng Supra	2026-01-08 14:07:12.46	\N	import	\N	\N	2026-01-08 14:07:12.461024	2026-01-08 14:07:12.461024	false_120363266486054443@g.us_ACA722A8C6571A0A76CF2478C376C8A7_87716586856657@lid	\N
f2f1ojdv74jzxs6txwm99flv	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	14000.00	Red Velvet	2026-01-08 14:07:12.46	\N	import	\N	\N	2026-01-08 14:07:12.478732	2026-01-08 14:07:12.478732	false_120363266486054443@g.us_ACA722A8C6571A0A76CF2478C376C8A7_87716586856657@lid	\N
jm1t8699ney94a23e582qlgr	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10000.00	Cilok	2026-01-08 14:10:36.365	\N	import	\N	\N	2026-01-08 14:10:36.366423	2026-01-08 14:10:36.366423	false_120363266486054443@g.us_AC9401C5DFD82087531B98D31A3DB3BD_87716586856657@lid	\N
zno8d5eq6x4xcb9nk7yfdcyw	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10000.00	Cilok lagi	2026-01-08 14:15:59.673	\N	import	\N	\N	2026-01-08 14:15:59.673883	2026-01-08 14:15:59.673883	false_120363266486054443@g.us_AC6C8029E9D87D5254A97759403EF81A_87716586856657@lid	\N
y7vln26g15mdrjddkpqxwfd6	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	12000.00	BC Mkroni Lv.15 135g	2026-01-08 15:08:36.868	\N	import	\N	\N	2026-01-08 15:08:36.869764	2026-01-08 15:08:36.869764	false_120363266486054443@g.us_AC912F84C6D60B1A6BC9CE365249F215_87716586856657@lid	\N
wtrky7b0w7i0cch5saskwz8p	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6500.00	Ultra Slim Plain 200	2026-01-08 15:08:36.868	\N	import	\N	\N	2026-01-08 15:08:36.88747	2026-01-08 15:08:36.88747	false_120363266486054443@g.us_AC912F84C6D60B1A6BC9CE365249F215_87716586856657@lid	\N
gv0nx9z93oiohou7i22coqws	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	pah4exfovbproa0octiteo5p	expense	23500.00	ABC Alk AAA-LR03/2mp	2026-01-08 15:08:36.868	\N	import	\N	\N	2026-01-08 15:08:36.894729	2026-01-08 15:08:36.894729	false_120363266486054443@g.us_AC912F84C6D60B1A6BC9CE365249F215_87716586856657@lid	\N
v78kh5vj1e7pgebuhp4xqkof	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10900.00	Taro Seaweed 115g	2026-01-08 15:08:36.868	\N	import	\N	\N	2026-01-08 15:08:36.901648	2026-01-08 15:08:36.901648	false_120363266486054443@g.us_AC912F84C6D60B1A6BC9CE365249F215_87716586856657@lid	\N
hq6k8z2rppg7ckwt0jrd6leq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	mq0hdbrixn5u2per48bpqikj	expense	10000.00	Takari	2026-01-08 15:16:24.864	\N	import	\N	\N	2026-01-08 15:16:24.865844	2026-01-08 15:16:24.865844	false_120363266486054443@g.us_ACFAC92BA69D44105C47D2336441FDD9_87716586856657@lid	\N
hdi27y32qmuujqp1hl1d3xx1	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	2500.00	Admin transfer	2026-01-09 03:48:16.251	\N	import	\N	\N	2026-01-09 03:48:16.252876	2026-01-09 03:48:16.252876	false_120363266486054443@g.us_3EB023E07582753C7F839B_87716586856657@lid	\N
e7pzi65i7vc7bj8l4pnq5zyx	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	45400.00	Nasi bakar ayam jumbo	2026-01-09 04:32:37.887	\N	import	\N	\N	2026-01-09 04:32:37.889572	2026-01-09 04:32:37.889572	false_120363266486054443@g.us_ACE50489718D18DCBC7DF2902EF66941_61727723016403@lid	\N
jyaz3go4g56673j1vyrh3j7m	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g4xmqmbyhe8kgcnpv7fbygw9	income	1955854.00	Pencairan petty cash	2026-01-09 10:27:53.497	\N	import	\N	\N	2026-01-09 10:27:53.499023	2026-01-09 10:27:53.499023	false_120363266486054443@g.us_AC1E3B8649BF6D062A12D29D753B1AB4_87716586856657@lid	\N
m12d8ffn00i1am6igz98vn0s	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	33000.00	Nasi bebek + Lele Purnama	2026-01-09 12:10:54.442	\N	import	\N	\N	2026-01-09 12:10:54.443579	2026-01-09 12:10:54.443579	false_120363266486054443@g.us_ACB0AB63FFF7D448B52C77542C7C1351_61727723016403@lid	\N
bb5va03w2at1dz594suvwopp	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vxkmlzoumr6gosozymtu2j13	expense	100000.00	Celana	2026-01-09 16:39:21.79	\N	import	\N	\N	2026-01-09 16:39:21.79142	2026-01-09 16:39:21.79142	false_120363266486054443@g.us_3EB009D2272FE12F88F773_87716586856657@lid	\N
jhfiphhp0ghdbguej15tagyl	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	vxkmlzoumr6gosozymtu2j13	expense	80000.00	Celana	2026-01-09 16:39:24.428	\N	import	\N	\N	2026-01-09 16:39:24.433398	2026-01-09 16:39:24.433398	false_120363266486054443@g.us_3EB020CEAAB3A553F4E934_87716586856657@lid	\N
cn2kiltthhewhex86zepd3p0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	60000.00	Mie goreng Shanaya	2026-01-09 21:05:53.11	\N	import	\N	\N	2026-01-09 21:05:53.112007	2026-01-09 21:05:53.112007	false_120363266486054443@g.us_3EB097426BB12F6BC52BA7_87716586856657@lid	\N
rbe5p5572zd0s876pjgfqdqo	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6600.00	Nutriboost	2026-01-10 13:11:17.525	\N	import	\N	\N	2026-01-10 13:11:17.526641	2026-01-10 13:11:17.526641	false_120363266486054443@g.us_ACAB349BABB12A3257B21BCB2F351DA8_87716586856657@lid	\N
otsp62096js8t549mckmxqli	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	16000.00	Soto sapi pisah	2026-01-10 13:33:09.655	\N	import	\N	\N	2026-01-10 13:33:09.657111	2026-01-10 13:33:09.657111	false_120363266486054443@g.us_AC7D0D8814F2B039D4734D62E478299D_87716586856657@lid	\N
cak6dwoe6keyxsui8dsb13p0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	7000.00	Jeruk dingin	2026-01-10 13:33:09.655	\N	import	\N	\N	2026-01-10 13:33:09.670712	2026-01-10 13:33:09.670712	false_120363266486054443@g.us_AC7D0D8814F2B039D4734D62E478299D_87716586856657@lid	\N
aw8r11sn132botck7rhcufky	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	12000.00	Soto ayam kampung kecil	2026-01-10 13:33:09.655	\N	import	\N	\N	2026-01-10 13:33:09.67998	2026-01-10 13:33:09.67998	false_120363266486054443@g.us_AC7D0D8814F2B039D4734D62E478299D_87716586856657@lid	\N
pm3o91gk4a2qgczsj2fi4ws8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6000.00	Teh manis dingin	2026-01-10 13:33:09.655	\N	import	\N	\N	2026-01-10 13:33:09.686718	2026-01-10 13:33:09.686718	false_120363266486054443@g.us_AC7D0D8814F2B039D4734D62E478299D_87716586856657@lid	\N
b97fmxz7y1avwro06nwwwcd5	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9900.00	Marjan Syrp Mln40	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.281366	2026-01-10 14:19:02.281366	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
pk1zmb6yu7i0768zewzkl93c	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	9900.00	Marjan Syrp Mln40	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.298607	2026-01-10 14:19:02.298607	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
pt46munmqcwrvpawtvnst9el	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	26490.00	Pringles Original	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.306091	2026-01-10 14:19:02.306091	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
vvw1hw4iro27r10g5ca8z21v	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	35610.00	Melon Super	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.314395	2026-01-10 14:19:02.314395	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
i0j998e3vwjfhnym3zvgd4y4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20380.00	Mayasi Kcg Garlic	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.329699	2026-01-10 14:19:02.329699	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
tzcfu49k4p8tnbpcvhjbkto6	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	14990.00	Promina Yog/M Mlk	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.33668	2026-01-10 14:19:02.33668	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
zu32b7z3w7jofwr0wj025dtx	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6890.00	G/F UHT F/Crm200	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.346694	2026-01-10 14:19:02.346694	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
m8rzi90rb9jjc3jrt9ehsqgp	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	16130.00	Deka Crps Cho Nut	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.353695	2026-01-10 14:19:02.353695	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
vy5cpod65hj3rci4er3n83wp	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	djt95hn4ga4ee05pprlinb47	expense	23690.00	Im Boost Extra	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.362668	2026-01-10 14:19:02.362668	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
dr05brd248rrz2n3tdszlegw	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	400.00	Plastic Shop Bag	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.368336	2026-01-10 14:19:02.368336	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
b0cf58ion3yzsq8nthiaz6me	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	77900.00	Anak Raja Brs Khs	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.374809	2026-01-10 14:19:02.374809	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
p5kg5ymuq7xig79ab68whi0c	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	luct74dft3vwxhioaxpfa5wn	income	1000000.00	Hadiah lagi	2026-01-09 09:54:00	\N	import	\N	\N	2026-01-10 16:54:52.102735	2026-01-10 16:55:06.371	false_120363266486054443@g.us_3EB0A29314E80ADB0148EB_87716586856657@lid	\N
ubkrytznzkh1sjpvrhowt82y	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	luct74dft3vwxhioaxpfa5wn	income	1000000.00	Hadiah	2026-01-09 09:54:00	\N	import	\N	\N	2026-01-10 16:54:52.09684	2026-01-10 16:55:12.056	false_120363266486054443@g.us_3EB0A29314E80ADB0148EB_87716586856657@lid	\N
kd6iakamo6yy9qgd7qufkuaa	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	62990.00	Scott Emuls.org20	2026-01-10 14:19:02.279	\N	import	\N	\N	2026-01-10 14:19:02.321265	2026-01-10 16:59:19.962	false_120363266486054443@g.us_AC50A74E01CD767FF4181E4AE6FA000E_61727723016403@lid	\N
cx2izmyh2fybw9p5v8myiuf5	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	u4libtwy356k6u47140tlb0d	expense	11500.00	Gocar dari Superindo ke rumah	2026-01-10 07:00:00	\N	import	\N	\N	2026-01-10 17:00:57.09033	2026-01-10 17:01:31.215	false_120363266486054443@g.us_AC25E847EE7BFEAD06ACFD46BFC8F835_87716586856657@lid	\N
cjwye919rcwjymd47amictjr	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	u4libtwy356k6u47140tlb0d	expense	32000.00	Gocar ke Superindo	2026-01-10 08:11:00	\N	import	\N	\N	2026-01-10 13:11:08.424279	2026-01-10 17:03:21.909	false_120363266486054443@g.us_AC5D59648927C20FC36B16F8C5FC31F0_87716586856657@lid	\N
h1hz8eq7nilcuii7fyv5hruy	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	12500.00	Es batu	2026-01-11 10:54:01.604	\N	import	\N	\N	2026-01-11 10:54:01.60542	2026-01-11 10:54:01.60542	false_120363266486054443@g.us_3EB0007C7B9CB3EE005C0F_87716586856657@lid	\N
ulq1lj10i9s317y3a49t7b5l	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10000.00	Air mineral Argo	2026-01-11 10:54:01.604	\N	import	\N	\N	2026-01-11 10:54:01.615458	2026-01-11 10:54:01.615458	false_120363266486054443@g.us_3EB0007C7B9CB3EE005C0F_87716586856657@lid	\N
gmcy9fp4uuv8aunj9r9j87zh	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	bklplqru30q2x22fxxkaj19h	expense	100000.00	Laundry jas	2026-01-11 12:55:02.312	\N	import	\N	\N	2026-01-11 12:55:02.314295	2026-01-11 12:55:02.314295	false_120363266486054443@g.us_ACD0682B8B8A5318E16BAFABEDAC7854_87716586856657@lid	\N
bq0a4y6ij9d0xncsz0l1j8bf	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	33880.00	Nasi kulit lengkap	2026-01-11 13:35:47.069	\N	import	\N	\N	2026-01-11 13:35:47.070454	2026-01-11 13:35:47.070454	false_120363266486054443@g.us_AC659AF4A010BBFF765100547D25700F_87716586856657@lid	\N
k2mqthp8fu3p01xbgdtauy89	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	19690.00	Ayam goreng rempah	2026-01-11 13:35:47.069	\N	import	\N	\N	2026-01-11 13:35:47.089834	2026-01-11 13:35:47.089834	false_120363266486054443@g.us_AC659AF4A010BBFF765100547D25700F_87716586856657@lid	\N
o1pbdw7jjvz9994w6w1j2bgl	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	11000.00	Teh pucuk	2026-01-11 13:35:47.069	\N	import	\N	\N	2026-01-11 13:35:47.098244	2026-01-11 13:35:47.098244	false_120363266486054443@g.us_AC659AF4A010BBFF765100547D25700F_87716586856657@lid	\N
wtbyh35crfkei3r3nd7upcwy	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	3300.00	Kerupuk	2026-01-11 13:35:47.069	\N	import	\N	\N	2026-01-11 13:35:47.112589	2026-01-11 13:35:47.112589	false_120363266486054443@g.us_AC659AF4A010BBFF765100547D25700F_87716586856657@lid	\N
fbf37a4zkbd91ehp1ru2hwi0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6600.00	Air mineral	2026-01-11 13:35:47.069	\N	import	\N	\N	2026-01-11 13:35:47.105138	2026-01-11 13:35:47.105138	false_120363266486054443@g.us_AC659AF4A010BBFF765100547D25700F_87716586856657@lid	\N
dg5dy6fj9brk4ge6rfe8ir6w	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir nasi kulit	2026-01-11 13:38:05.097	\N	import	\N	\N	2026-01-11 13:38:05.098992	2026-01-11 13:38:05.098992	false_120363266486054443@g.us_ACC740860798460FF41B4A641D2C82B3_87716586856657@lid	\N
xmnhrmtscf2wse6gbbe2auny	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	ubb166m0ep1aa7fnyezho4ps	expense	114410.00	Kondom + Lube	2026-01-11 15:36:27.813	\N	import	\N	\N	2026-01-11 15:36:27.815345	2026-01-11 15:36:27.815345	false_120363266486054443@g.us_ACF19B8277166E2ABC3ADA988E3C7F7A_87716586856657@lid	\N
q5up472bcaidltdvirboeac4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	pah4exfovbproa0octiteo5p	expense	214381.00	Server dsg	2026-01-11 15:59:58.355	\N	import	\N	\N	2026-01-11 15:59:58.357556	2026-01-11 15:59:58.357556	false_120363266486054443@g.us_3EB03286CA57FCF8FBE3B0_87716586856657@lid	\N
h6fuwzj4w9128p60j02m220u	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	5000.00	Denda kekurangan saldo	2026-01-11 16:10:05.393	\N	import	\N	\N	2026-01-11 16:10:05.395374	2026-01-11 16:10:05.395374	false_120363266486054443@g.us_3EB0AB8725D87392C49F35_87716586856657@lid	\N
exvbl4z3s4lhq0ybvz0blnpc	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g4xmqmbyhe8kgcnpv7fbygw9	income	214381.00	Pencairan petty cash server dsg	2026-01-12 10:52:52.355	\N	import	\N	\N	2026-01-12 10:52:52.356573	2026-01-12 10:52:52.356573	false_120363266486054443@g.us_3EB0A209471AB88151D47E_87716586856657@lid	\N
akoa1eee83m0sgezydosv2qu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	2500.00	Admin TF	2026-01-12 11:45:45	\N	import	\N	\N	2026-01-12 11:45:45.001904	2026-01-12 11:45:45.001904	false_120363266486054443@g.us_AC369D99B96C3D4643772477F2E48455_87716586856657@lid	\N
pbyfk0jv47a1jkoo1npjgd1e	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	kyazsb4ugvupwk27dlropatl	expense	2400000.00	UKT Firda	2026-01-12 11:46:02.16	\N	import	\N	\N	2026-01-12 11:46:02.161672	2026-01-12 11:46:02.161672	false_120363266486054443@g.us_ACCA1BF062605617893D7BDBF953CADA_87716586856657@lid	\N
vok4r61clyrqhkkcu9953dye	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	79500.00	Paket tanpa mainan	2026-01-12 12:43:22.824	\N	import	\N	\N	2026-01-12 12:43:22.826342	2026-01-12 12:43:22.826342	false_120363266486054443@g.us_AC1C9B95FABA4CB4365B362102B05754_87716586856657@lid	\N
ppk60mdv4pu0c2wakmd7cqp3	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	2000.00	Milo (reg)	2026-01-12 12:43:22.824	\N	import	\N	\N	2026-01-12 12:43:22.843531	2026-01-12 12:43:22.843531	false_120363266486054443@g.us_AC1C9B95FABA4CB4365B362102B05754_87716586856657@lid	\N
j1bcg4hs1tresw454xdp10th	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	1500.00	Fruit tea blackcurrant	2026-01-12 12:43:22.824	\N	import	\N	\N	2026-01-12 12:43:22.851399	2026-01-12 12:43:22.851399	false_120363266486054443@g.us_AC1C9B95FABA4CB4365B362102B05754_87716586856657@lid	\N
t26cbqkerk3z8l6ki52e7edz	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	2000.00	Sprite medium	2026-01-12 12:43:22.824	\N	import	\N	\N	2026-01-12 12:43:22.859561	2026-01-12 12:43:22.859561	false_120363266486054443@g.us_AC1C9B95FABA4CB4365B362102B05754_87716586856657@lid	\N
zk5h9xreffkxwdq3btebunuv	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20000.00	French fries medium	2026-01-12 12:43:22.824	\N	import	\N	\N	2026-01-12 12:43:22.866734	2026-01-12 12:43:22.866734	false_120363266486054443@g.us_AC1C9B95FABA4CB4365B362102B05754_87716586856657@lid	\N
zeolsh9fdg3iwgdp2x4p7i4t	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	4000.00	Alfa Ecobg30x40	2026-01-12 17:18:51.925	\N	import	\N	\N	2026-01-12 17:18:51.926842	2026-01-12 17:18:51.926842	false_120363266486054443@g.us_3EB06687BB29A8D71336D5_87716586856657@lid	\N
w0j5mitok43n9bznworapzgq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	35900.00	Hpy egg tlr omg	2026-01-12 17:18:51.925	\N	import	\N	\N	2026-01-12 17:18:51.943861	2026-01-12 17:18:51.943861	false_120363266486054443@g.us_3EB06687BB29A8D71336D5_87716586856657@lid	\N
s62o98gyb7ecj4na1mmior8a	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	d5329tkcqhbqz5a5v1vy4exx	expense	15600.00	Ultra FC 250ML (2x)	2026-01-12 17:18:51.925	\N	import	\N	\N	2026-01-12 17:18:51.951971	2026-01-12 17:18:51.951971	false_120363266486054443@g.us_3EB06687BB29A8D71336D5_87716586856657@lid	\N
xcfvz5jlhkvez9rvuysslfh9	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	2500.00	Sajiku SPC 20G	2026-01-12 17:18:51.925	\N	import	\N	\N	2026-01-12 17:18:51.959668	2026-01-12 17:18:51.959668	false_120363266486054443@g.us_3EB06687BB29A8D71336D5_87716586856657@lid	\N
bdzj5z24lp1r88tsy7bao6uk	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	14900.00	Sayur Soup	2026-01-12 17:18:51.925	\N	import	\N	\N	2026-01-12 17:18:51.967309	2026-01-12 17:18:51.967309	false_120363266486054443@g.us_3EB06687BB29A8D71336D5_87716586856657@lid	\N
ykimf2q1bixcbqk25oqfjzse	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	2500.00	Admin transfer	2026-01-12 17:45:01.362	\N	import	\N	\N	2026-01-12 17:45:01.363822	2026-01-12 17:45:01.363822	false_120363266486054443@g.us_3EB0C3ED9F4424870663B5_87716586856657@lid	\N
ut1bx6t5uuejl5f6fp93bya8	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	k1pirmf2iwfckxb0lk1sukss	expense	349000.00	Chatgpt	2026-01-12 17:48:24.99	\N	import	\N	\N	2026-01-12 17:48:24.991764	2026-01-12 17:48:24.991764	false_120363266486054443@g.us_3EB0D1508838058BD663D2_87716586856657@lid	\N
kwmuzp9bym484aafm7f84mag	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	c9s823pr17y8fql3vovbadp7	expense	32000.00	Pertamax	2026-01-13 05:27:00.689	\N	import	\N	\N	2026-01-13 05:27:00.690772	2026-01-13 05:27:00.690772	false_120363266486054443@g.us_ACF2A10AEFF157CE9D23EF57BED00192_87716586856657@lid	\N
p1vghlyjgt3v28jjszcuqcza	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	37400.00	Chicken karage curry	2026-01-13 10:30:26.798	\N	import	\N	\N	2026-01-13 10:30:26.799659	2026-01-13 10:30:26.799659	false_120363266486054443@g.us_ACFA9A26EEB69E6F6283F71183EE36CC_87716586856657@lid	\N
x2p64p91ojq8l6crbvee8zzf	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	40700.00	Chicken salted egg	2026-01-13 10:30:26.798	\N	import	\N	\N	2026-01-13 10:30:26.805825	2026-01-13 10:30:26.805825	false_120363266486054443@g.us_ACFA9A26EEB69E6F6283F71183EE36CC_87716586856657@lid	\N
p40iki8kkfwo0b53azb87r6p	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	3590.00	Ultra Mimi F/CRM125	2026-01-13 16:50:56.981	\N	import	\N	\N	2026-01-13 16:50:56.982323	2026-01-13 16:50:56.982323	false_120363266486054443@g.us_3EB052F9BE8BAADCFB7CBF_87716586856657@lid	\N
lpec4iij5yl86hc2bxx93u5w	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	8790.00	Bebelac UHT ORI 165	2026-01-13 16:50:56.981	\N	import	\N	\N	2026-01-13 16:50:56.99547	2026-01-13 16:50:56.99547	false_120363266486054443@g.us_3EB052F9BE8BAADCFB7CBF_87716586856657@lid	\N
jr3gcrny23m86metfhstfmam	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	10190.00	Mayasi KCG GaARLIC65	2026-01-13 16:50:56.981	\N	import	\N	\N	2026-01-13 16:50:57.003896	2026-01-13 16:50:57.003896	false_120363266486054443@g.us_3EB052F9BE8BAADCFB7CBF_87716586856657@lid	\N
bk9xttqdq6crqu6sq0e17uqo	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	19990.00	Alamii Mlk&COCOA3X20	2026-01-13 16:50:56.981	\N	import	\N	\N	2026-01-13 16:50:57.010401	2026-01-13 16:50:57.010401	false_120363266486054443@g.us_3EB052F9BE8BAADCFB7CBF_87716586856657@lid	\N
qr8zpyo3r6yviqd6jqeaijl2	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	6490.00	Ultra PLN 250	2026-01-13 16:50:56.981	\N	import	\N	\N	2026-01-13 16:50:56.989617	2026-01-13 17:07:59.099	false_120363266486054443@g.us_3EB052F9BE8BAADCFB7CBF_87716586856657@lid	\N
gliho7fwrod1ow972rpalfbg	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g4xmqmbyhe8kgcnpv7fbygw9	income	1365000.00	Pencairan uang perjalanan dinas ke Jakarta	2026-01-14 02:36:44.498	\N	import	\N	\N	2026-01-14 02:36:44.499395	2026-01-14 02:36:44.499395	false_120363266486054443@g.us_ACCCD0291699D792CDDB10BEA2F414DB_87716586856657@lid	\N
spo6187p6ai95qsgnrpawfr0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	20000.00	MaruDeals #F Crispy	2026-01-14 04:17:17.53	\N	import	\N	\N	2026-01-14 04:17:17.531659	2026-01-14 04:17:17.531659	false_120363266486054443@g.us_AC7143D70375D6E563313A5D3CA0D2A4_61727723016403@lid	\N
tiewvyfrb3fmyg41mnc659xd	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	24000.00	MaruDeals B	2026-01-14 04:17:17.53	\N	import	\N	\N	2026-01-14 04:17:17.551436	2026-01-14 04:17:17.551436	false_120363266486054443@g.us_AC7143D70375D6E563313A5D3CA0D2A4_61727723016403@lid	\N
rr1l0wccozrzf18s8emezbhu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	a9z22344lu18lmk6tvutk88a	expense	2000.00	Parkir Hotways	2026-01-14 05:37:31.432	\N	import	\N	\N	2026-01-14 05:37:31.433436	2026-01-14 05:37:31.433436	false_120363266486054443@g.us_3EB092A5AB5578B7ECF830_87716586856657@lid	\N
rlz9zg9foao7zkfjtwyqb68o	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	zqv2jhf4lifea9v9v5yzqev9	expense	350000.00	Tiket Kereta Majapahit ML - PSE	2026-01-14 05:56:09.838	\N	import	\N	\N	2026-01-14 05:56:09.839273	2026-01-14 05:56:09.839273	false_120363266486054443@g.us_3EB09B61F2D509D673661D_87716586856657@lid	\N
ql6f3xs3y7uz65ns6epf3gd4	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	11000.00	BS - Fruit Tea Apel Botol 500 mL	2026-01-14 12:55:11.34	\N	import	\N	\N	2026-01-14 12:55:11.341301	2026-01-14 12:55:11.341301	false_120363266486054443@g.us_3EB0021D662A22AB6DC7CD_87716586856657@lid	\N
z4dbafki3iwwhsuif3ykv94v	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	33000.00	BS - Kunikita Ciomy Cuanky Chicken Spicy Cup	2026-01-14 12:55:11.34	\N	import	\N	\N	2026-01-14 12:55:11.358074	2026-01-14 12:55:11.358074	false_120363266486054443@g.us_3EB0021D662A22AB6DC7CD_87716586856657@lid	\N
legkoe2o0b07s74wqco22jru	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	44000.00	Ayam geprek	2026-01-14 13:47:02.121	\N	import	\N	\N	2026-01-14 13:47:02.122492	2026-01-14 13:47:02.122492	false_120363266486054443@g.us_3EB0E5D9B14848DCB15D46_87716586856657@lid	\N
d38ynn740ltszh6vllmx9q8v	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	39000.00	Astaga 2 (Nasi, Paha Atas, Teh Pucuk Harum)	2026-01-15 00:20:29.953	\N	import	\N	\N	2026-01-15 00:20:29.954952	2026-01-15 00:20:29.954952	false_120363266486054443@g.us_ACB5A3DDA4AE59F6307BF6A1DF3EA127_87716586856657@lid	\N
yivhfv3al8bgq39o44elb3jj	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	65000.00	Nasi ayam hainan (2)	2026-01-15 04:12:13.929	\N	import	\N	\N	2026-01-15 04:12:13.931038	2026-01-15 04:12:13.931038	false_120363266486054443@g.us_AC6EAF3387DC24571143F2C30050AF14_61727723016403@lid	\N
ghioqgogts08d576687lo1vv	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	xy6yfnwiwcm9bx1jvuue2vl6	expense	2500.00	Admin TF	2026-01-15 04:31:34.89	\N	import	\N	\N	2026-01-15 04:31:34.891825	2026-01-15 04:31:34.891825	false_120363266486054443@g.us_3EB0D17E71FC3310CE60A0_87716586856657@lid	\N
qdh4v0l1d4wmmdiauzve5g1q	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	it8ka5hkphd0tqimccz1gadd	expense	7500.00	IDM Pisau Cukur 2MP	2026-01-15 05:15:45.108	\N	import	\N	\N	2026-01-15 05:15:45.109381	2026-01-15 05:15:45.109381	false_120363266486054443@g.us_3EB097008D050809A041D6_87716586856657@lid	\N
lc56kkbtac8psqpw72ae81ng	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	29000.00	Kentang + Ayam McD	2026-01-15 05:16:06.501	\N	import	\N	\N	2026-01-15 05:16:06.5017	2026-01-15 05:16:06.5017	false_120363266486054443@g.us_3EB05B3FD3FC98B57ECCB1_87716586856657@lid	\N
pg3tqazvko57sxvmslrjoh3p	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uziu8urz63v6z0cbdorpburx	expense	283005.00	Paragon Hotel	2026-01-15 11:28:20.496	\N	import	\N	\N	2026-01-15 11:28:20.497581	2026-01-15 11:28:20.497581	false_120363266486054443@g.us_AC0EE0C4D7F43A3ECDF308E5578E8F89_87716586856657@lid	\N
rwfh8iwouckwpiebxphztx9b	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	34650.00	Chocolate ice	2026-01-15 11:31:50.473	\N	import	\N	\N	2026-01-15 11:31:50.475124	2026-01-15 11:31:50.475124	false_120363266486054443@g.us_AC2551F882F1C355E5482FA836E7687A_87716586856657@lid	\N
livb6zlrq4d68llf1ncymunb	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	dekkbigfbhapkt0mlxc6wt3y	income	1980000.00	Pencairan GoPay Pinjam	2026-01-15 11:50:55.096	\N	import	\N	\N	2026-01-15 11:50:55.097165	2026-01-15 11:50:55.097165	false_120363266486054443@g.us_3EB0C9A21AB0A287170CCE_87716586856657@lid	\N
djm3wb6cgqkvyrc8lhmk312q	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	zqv2jhf4lifea9v9v5yzqev9	expense	415000.00	Tiket kereta PSE - ML	2026-01-15 11:55:13.009	\N	import	\N	\N	2026-01-15 11:55:13.010299	2026-01-15 11:55:13.010299	false_120363266486054443@g.us_3EB0C98BAFD1D1E7DDBFE0_61727723016403@lid	\N
jslqxpnunx9z36vx5u1xxdxs	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	u4libtwy356k6u47140tlb0d	expense	15500.00	Gojek gambir-hotel paragon	2026-01-15 14:04:18.695	\N	import	\N	\N	2026-01-15 14:04:18.696741	2026-01-15 14:04:18.696741	false_120363266486054443@g.us_AC28A0C888D917739ED6FCE3A929C343_87716586856657@lid	\N
s7lp82lo2p1nvyak237rejeh	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uziu8urz63v6z0cbdorpburx	expense	100000.00	Deposit Hotel Paragon	2026-01-15 14:04:24.836	\N	import	\N	\N	2026-01-15 14:04:24.837326	2026-01-15 14:04:24.837326	false_120363266486054443@g.us_ACF284DB958B10F3945DE13B3EB27407_87716586856657@lid	\N
zn5zpcd4hnc35nsm03siwcr7	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	mq0hdbrixn5u2per48bpqikj	expense	60000.00	Mandi	2026-01-15 00:36:17.693	\N	import	\N	\N	2026-01-15 00:36:17.694508	2026-01-15 14:23:58.223	false_120363266486054443@g.us_AC2EAD4FB82C41352E1249995259548A_87716586856657@lid	\N
svnqtb448znmf5dylxz7ixl7	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	91900.00	Kue basah (15)	2026-01-16 00:29:47.644	\N	import	\N	\N	2026-01-16 00:29:47.645556	2026-01-16 00:29:47.645556	false_120363266486054443@g.us_AC6A6E72F642C78D54B3D7E1CA407F52_61727723016403@lid	\N
mox1lmaycrtbinus0cf1hzcm	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	g4xmqmbyhe8kgcnpv7fbygw9	income	100000.00	Pengembalian deposit hotel	2026-01-16 04:55:06.404	\N	import	\N	\N	2026-01-16 04:55:06.405034	2026-01-16 04:55:06.405034	false_120363266486054443@g.us_AC237A2BECD19D7E1D0C1A14B4AFF637_87716586856657@lid	\N
sigz5tcq75svv639ynpwgru0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	25000.00	Mie Nyemek Jogja Dobel + Es Teh + Krupuk	2026-01-16 04:55:43.761	\N	import	\N	\N	2026-01-16 04:55:43.762018	2026-01-16 04:55:43.762018	false_120363266486054443@g.us_AC80C6BC67A8D18C95D97BA1000611A1_87716586856657@lid	\N
rxjqggc8dw3nlcm1rv7ifdc6	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	22100.00	Alfamart Telur Ayam Negeri (Happy Egg) 10 pcs	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.069535	2026-01-16 05:52:28.069535	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
xy3jwlsjttu9jctl2dmt6vsq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	l4msnwrdcurwly8no8hzzkmk	expense	9800.00	Ultra Mimi Kids Susu UHT FUll Cream kotak 125 mL	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.054929	2026-01-16 05:53:55.506	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
au2hts3ikvmatijsbwwhs8w9	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	21700.00	Ultra Milk Susu UHT Full Cream Kotal 1 L	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.063975	2026-01-16 05:54:00.505	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
tpdb7s6524m644zvvr1bfunq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	22700.00	Aqua air mineral galon (isi ulang) 19 L	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.040737	2026-01-16 08:00:58.04	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
e8skh0yd16hdibkg8tz5ocg1	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	28000.00	Kentang McD Large	2026-01-16 05:36:10.536	\N	import	\N	\N	2026-01-16 05:36:10.53678	2026-01-16 08:01:03.456	false_120363266486054443@g.us_ACA9C4B543ED39B5E5C7DFEB35EC5790_87716586856657@lid	\N
mqayn1a8qrujtf3parrud85d	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	51900.00	Golden Farm Kentang Goreng Shoestring 1kg	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.075973	2026-01-16 05:52:28.075973	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
rkw8xoiie8ex2ynllluuxphh	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	uddiz2wfe43h337yrhrvnd2r	expense	20400.00	Bimoli Minyak Goreng Pouch 1 L	2026-01-16 05:52:28.039	\N	import	\N	\N	2026-01-16 05:52:28.08157	2026-01-16 05:52:28.08157	false_120363266486054443@g.us_3EB053345AF0A1C6E50763_87716586856657@lid	\N
xx4aatxslxku1hcvpkhhktiu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	30500.00	Spaghetti Ayam McD	2026-01-16 07:59:58.157	\N	import	\N	\N	2026-01-16 07:59:58.159331	2026-01-16 07:59:58.159331	false_120363266486054443@g.us_3EB0315AFFCE7785FC6060_87716586856657@lid	\N
a6ittr105dnizsbeft43920f	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	4000.00	Upgrade Sprite Large McD	2026-01-16 07:59:58.157	\N	import	\N	\N	2026-01-16 07:59:58.179841	2026-01-16 07:59:58.179841	false_120363266486054443@g.us_3EB0315AFFCE7785FC6060_87716586856657@lid	\N
ra7ahtpgbdoe4h58mzqkz4rq	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	u4libtwy356k6u47140tlb0d	expense	15000.00	Gojek Pasar Senen - Stasiun Pasar Senen	2026-01-16 11:15:19.695	\N	import	\N	\N	2026-01-16 11:15:19.69638	2026-01-16 11:29:07.084	false_120363266486054443@g.us_3EB0CED751AE41650C4C30_87716586856657@lid	["jakarta"]
pfnizabloxbm9u0dgtrx4qhh	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	11000.00	JetZ	2026-01-16 11:30:51.354	\N	import	\N	\N	2026-01-16 11:30:51.355448	2026-01-16 11:30:51.355448	false_120363266486054443@g.us_3EB0AA0185F9E6872B68D7_87716586856657@lid	\N
kua1izwrneu67bgxb1kgfkw0	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	11000.00	Fruit Tea Apel Botol 500ML	2026-01-16 11:30:51.354	\N	import	\N	\N	2026-01-16 11:30:51.375895	2026-01-16 11:30:51.375895	false_120363266486054443@g.us_3EB0AA0185F9E6872B68D7_87716586856657@lid	\N
rnnrzh24vmar6nf7ohreyfog	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	5000.00	KK CUP ICE	2026-01-16 11:30:51.354	\N	import	\N	\N	2026-01-16 11:30:51.384069	2026-01-16 11:30:51.384069	false_120363266486054443@g.us_3EB0AA0185F9E6872B68D7_87716586856657@lid	\N
mreobw8mifaqibfi0hxv22mu	po2vul7bqa4l1gtpcf0c0pdn	odqiqvhgzxtosku3mk7mnitn	nxkyb0xsmom23crfuaf4jy2s	expense	33000.00	KUNIKITA CIOMY CUANKI CHEESE SPICY CUP	2026-01-16 11:30:51.354	\N	import	\N	\N	2026-01-16 11:30:51.394965	2026-01-16 11:30:51.394965	false_120363266486054443@g.us_3EB0AA0185F9E6872B68D7_87716586856657@lid	\N
\.


--
-- Data for Name: notification_action_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_action_logs (id, notification_id, action_key, acted_by, comment, acted_at) FROM stdin;
\.


--
-- Data for Name: notification_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_actions (id, notification_id, action_key, label, requires_comment, created_at) FROM stdin;
v38jgfgcmaibqifvnkkmdh4l	ro0r88cj3tdqh1i14iwdjfu6	approve	Approve	f	2025-12-28 18:53:21.649263+00
nnzecc2e51g8gs22h23ohqg1	ro0r88cj3tdqh1i14iwdjfu6	request_changes	Request Changes	t	2025-12-28 18:53:21.649263+00
\.


--
-- Data for Name: notification_channel_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_channel_overrides (id, category, channel, enforced, reason, effective_from, effective_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, metadata, status, category, created_at, read_at, expires_at, group_key) FROM stdin;
bej2h0gr3vhtrquaeo8zh9v5	po2vul7bqa4l1gtpcf0c0pdn	informational	Welcome to the notification center	You now have a dedicated notification hub. Future workflow updates will appear here.	{"linkHref": "/dashboard", "linkLabel": "View dashboard"}	unread	system	2025-12-28 17:53:21.641+00	\N	\N	\N
ro0r88cj3tdqh1i14iwdjfu6	po2vul7bqa4l1gtpcf0c0pdn	approval	Purchase order PO-1024 needs your review	A new purchase order has been submitted and is waiting on your approval.	{"resourceId": "PO-1024", "resourceType": "purchaseOrder"}	unread	approvals	2025-12-28 12:53:21.641+00	\N	\N	\N
wgontoixl8b96g1a99ag2lt2	po2vul7bqa4l1gtpcf0c0pdn	informational	Weekly security scan complete	The automated vulnerability scan completed without new findings.	{"priority": "low"}	read	reports	2025-12-25 18:53:21.641+00	2025-12-26 18:53:21.641+00	\N	\N
\.


--
-- Data for Name: oauth_google; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.oauth_google (id, user_id, provider_id, name, given_name, family_name, access_token, refresh_token, locale, email, profile_picture_url, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oauth_microsoft; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.oauth_microsoft (id, user_id, provider_id, access_token, refresh_token, email, display_name, given_name, surname, user_principal_name, job_title, mobile_phone, office_location, preferred_language, profile_picture_url, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, description, created_at, updated_at) FROM stdin;
w6vcxdwtzqdfutql1ifwqari	dev-routes	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
y8v66061jj09ay0a7ix8271a	users.readAll	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
u3axq6fuc0kre18gqosr7i5l	users.create	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
jarpzlk627l1b52l8co2ljzu	users.update	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
pk29s2kef1zn0rrf2iirmiru	users.delete	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
s44zi0jj4m3v9rvzvoqros6l	users.restore	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
yk0l47n7hjtofimka0cmbuz4	permissions.read	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
z34k6jk13lnnntwosa452785	roles.read	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
avsyz7jrd3i426sass4suqqo	roles.create	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
tx98xeuo9o8o1w6jl3m0m67e	roles.update	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
aloey8jkaxgye6kyzicmjd29	roles.delete	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
aivld93kiedw6t6zt4jjkxjk	app-settings.read	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
jvnl1ejr5imhdx1k5dwrueee	app-settings.edit	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
yrkwk2mm1oxhgjv0ruipxlex	ms-graph.read	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
mku77jv3wm5e85c0jghh68jp	observability.read	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
vjfcbh8tg2tnd01bk60lmtnk	observability.write	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
h1cl3yuisow20m9qjj8xw0nx	observability.delete	\N	2025-12-28 18:53:21.557615	2025-12-28 18:53:21.557615
kr1sevci2wtoacy79h8v3tlw	users.assignPermissions	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
kt9uepgmbgmun5xmgtdory15	ujian.read	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
sph9z0d2jfzk7xx3xgggiu7r	ujian.create	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
zn0xegl8uzxuzhtjcv73z3p2	ujian.update	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
y3j30o9cenyq7hovwa154q1u	ujian.delete	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
duwkpr580fx59ntwwk1b9ys5	ujian.take	\N	2026-01-01 18:47:13.775921	2026-01-01 18:47:13.775921
\.


--
-- Data for Name: permissions_to_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions_to_roles ("roleId", "permissionId") FROM stdin;
q5q2vwvdo1pciiagb6b6d0oz	w6vcxdwtzqdfutql1ifwqari
q5q2vwvdo1pciiagb6b6d0oz	y8v66061jj09ay0a7ix8271a
q5q2vwvdo1pciiagb6b6d0oz	u3axq6fuc0kre18gqosr7i5l
q5q2vwvdo1pciiagb6b6d0oz	jarpzlk627l1b52l8co2ljzu
q5q2vwvdo1pciiagb6b6d0oz	pk29s2kef1zn0rrf2iirmiru
q5q2vwvdo1pciiagb6b6d0oz	s44zi0jj4m3v9rvzvoqros6l
q5q2vwvdo1pciiagb6b6d0oz	yk0l47n7hjtofimka0cmbuz4
q5q2vwvdo1pciiagb6b6d0oz	z34k6jk13lnnntwosa452785
q5q2vwvdo1pciiagb6b6d0oz	avsyz7jrd3i426sass4suqqo
q5q2vwvdo1pciiagb6b6d0oz	tx98xeuo9o8o1w6jl3m0m67e
q5q2vwvdo1pciiagb6b6d0oz	aloey8jkaxgye6kyzicmjd29
q5q2vwvdo1pciiagb6b6d0oz	aivld93kiedw6t6zt4jjkxjk
q5q2vwvdo1pciiagb6b6d0oz	jvnl1ejr5imhdx1k5dwrueee
q5q2vwvdo1pciiagb6b6d0oz	yrkwk2mm1oxhgjv0ruipxlex
q5q2vwvdo1pciiagb6b6d0oz	mku77jv3wm5e85c0jghh68jp
q5q2vwvdo1pciiagb6b6d0oz	vjfcbh8tg2tnd01bk60lmtnk
q5q2vwvdo1pciiagb6b6d0oz	h1cl3yuisow20m9qjj8xw0nx
q5q2vwvdo1pciiagb6b6d0oz	kr1sevci2wtoacy79h8v3tlw
q5q2vwvdo1pciiagb6b6d0oz	kt9uepgmbgmun5xmgtdory15
q5q2vwvdo1pciiagb6b6d0oz	sph9z0d2jfzk7xx3xgggiu7r
q5q2vwvdo1pciiagb6b6d0oz	zn0xegl8uzxuzhtjcv73z3p2
q5q2vwvdo1pciiagb6b6d0oz	y3j30o9cenyq7hovwa154q1u
q5q2vwvdo1pciiagb6b6d0oz	duwkpr580fx59ntwwk1b9ys5
\.


--
-- Data for Name: permissions_to_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions_to_users ("userId", "permissionId") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at) FROM stdin;
p8o1c1ts0ohdn11qlpugxbzp	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$Hg8pZZpLRMsM5svJ89pIDE6fhasOFEOSwiiThyMiuO8$ri+u8FsmPllWTnBORoGj9YCDHpCr7i+P1oNFBjWjmcw	2026-02-26 18:59:50.868	2025-12-28 18:59:50.869833	\N
xrlr5xt0e2i84mpd81eaibkr	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$WUx96amJhVa/Q1IYYRq3IY8Yr/8UaTVWUrp/Y8b/0DA$sMEr8PsjqJMDh0t/L0Ya4BdHUHLr/tcVvg3+ghBbeRA	2026-03-02 18:47:33.855	2026-01-01 18:47:33.856742	\N
y3sbiv7sdbwvphve0gjmrbdn	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$RANg/7AI71FnG6USO8wpKIPEJXJCWExGWsFPqcP0AA0$TDXYAoN2R7Mc6VE+QFzWGn8FNABemEkUwS64flPxhgU	2026-03-02 18:55:15.967	2026-01-01 18:55:15.96884	\N
mplzip2mkg28xx5dlo5xcc0t	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$pIqhdqdK+LVb5W4XyVWRmWOkK3NjGf0EHfTeK9mUo38$3JXXR9lHREDybQUHMMgMXnaBrd/k3f671kuwVG1Btgw	2026-03-02 18:57:26.494	2026-01-01 18:57:26.496121	\N
ttv95iz6gz085ebfutzvhr1u	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$9gJ+90fpmZZpNnF/oKAvq8UCyekVFxpVEYt8TLgZGQ0$BA5MGOUk7OOzKo8hsFufPB1iFIxO/BAu9ox+hsSprRU	2026-03-02 19:08:46.988	2026-01-01 19:08:46.989657	\N
vp879747xhidscja9peaeg1o	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$JNfxi3083s8I4ifl6KfvevlATyL7lS/uHR/r2r35n7s$CNDCq8cQz97SHlK19Mi7XnGzGLY1jnEGWhqi3kbgF/Q	2026-03-02 19:15:46.247	2026-01-01 19:15:46.248798	\N
gox5y7t45r1vplq4pahib6m7	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$8Q1awBSSgMQgnTmMrMkm8rJ75Hb7yLKCRCu2CoDkc3U$lCKPKCsapZU9AJGt198j+Uol1T/dz1OBrFOG4wMap8k	2026-03-02 19:20:29.609	2026-01-01 19:20:29.61109	\N
tth561b7n99pyleork00pu9h	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$m7NlDQf9s+Tl1TMzHqC1kiEp06XN0XVZy9tpyzTPGrI$H5SSgmBbFugSzh2c3amMezIhox++L/tbsIf4x5hBfs8	2026-03-03 04:11:54.207	2026-01-02 04:11:54.209458	\N
wm0p2rafg7c9mc4pzwhqcb6x	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$3aJacic65ndAUiG70S0KvELpHHMb/T0FJOEB09P1/SE$AAB/GD0S0v+lGNuXkTGdFd0BXsZVD5ntz/w4GIGYtBU	2026-03-04 08:46:40.873	2026-01-03 08:46:40.873841	\N
nx1dca2yqp9eugfz3u73q0jr	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$CRjMDaW2nK44/O8U6x20jSXbnz3rK9XqRzfeBEw+L+E$GFfCwnccRi+0jeSCvaOiYx+g+zZ6qeruGeulxWO9Q3s	2026-03-04 12:32:07.206	2026-01-03 12:32:07.207854	\N
uirfezo6ziaejvox0cik2417	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$9/rzYYFQdhs4F0A6sJL7FaR4fHY6VVyXnQAZhaR46WA$BrLI+geu84VicCNiUiRr8riiyZER4RewZtJAGSm/vbA	2026-03-04 12:42:03.055	2026-01-03 12:42:03.05715	\N
pyku68fr8iza7ek76nnaqjid	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$euAy1xjKtrTZGJVl2gGHfosv57E6qqXAf6s/lGoVBBg$zcxlRo21SjUHNlCkC4k570jsn796mY8Rp4mAh7QVCnU	2026-03-04 19:48:23.373	2026-01-03 19:48:23.375342	\N
w91ctynnewwrrj6qzwp8t1tm	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$9gPGLQuMAWiQHthgLoAjUI2P8P5T2ZhTf3+Lxp9moVc$UDbcBIhmoRigbr088SBQWojWMhGO8m2OSN4njOM6kt8	2026-03-05 12:31:33.393	2026-01-04 12:31:33.394046	\N
h56inpa434udxq1jqoic361k	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$D2+s9XTDuKs8ijlEMNx8LQrCy/5g7TF6bUy82lYjP3M$B5lFwoZpldA8D6U/5SXbCpjewX0h4RR7DsdWGDmnwuQ	2026-03-05 15:53:08.41	2026-01-04 15:53:08.412304	\N
v7u7vusn0bpntsu3prncxq4y	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$VKV7DVM17UK1wnH3azoDrKhnCTGOakmayXFKz+PUITM$FeTSR11r/MgTTOeAwX+gqCve7NK/E19hF+14u+e9OhQ	2026-03-06 17:08:46.492	2026-01-05 17:08:46.493048	\N
d7ul8uxil1m0q9y8fva1t6zp	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$adPzLyYPPmmj+ExqKqHBYIzn7e6ZLWsOwA+QupNoxkM$upn0V8cSXgYtMhyGxitqb3w5w0FoFgLodeN7G0jCwUU	2026-03-09 10:03:22.171	2026-01-08 10:03:22.172333	\N
f12mb2f0df1byh6nr2bxwnhb	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$qDwKO+jYrz7oNR6u9QaafqdnXNNndwybpze09TWzn80$BGujM2Aw76wcl++nm7UW9VQInfBQ3G6KvGbf4L2hiME	2026-03-09 11:00:26.627	2026-01-08 11:00:26.627635	\N
hdxdbvtg4oc8shaqr53t43q8	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$gxPWZ59dfODRIN/mmt4qnZdo8cFLpcjSzyf5rpRMMk8$gz4bncMwNcuYNwd0pFq+dALG7kOobBjElLKdTRDB/z0	2026-03-11 16:51:25.549	2026-01-10 16:51:25.551494	\N
opkzzwnxbq76w7vsvkbe15vs	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$Ne2cmmMPCyEgc2DfPVHyhUwvITmDFEPMgA3olVwhwvg$z9rQSKxE7SrhP4YKL+7oAlTnh6HWSsoEMbNVRTRryTs	2026-03-11 17:04:18.701	2026-01-10 17:04:18.702598	\N
fwiaehq3ahi2lnbxvdq9craa	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$YuLkkW6yQWu5QJGo12xonQZ2z4buiqvIa2v6g4kQhyE$G5sPtxeH+001AN8PNMiLX2Phf/D/kCCtAdoda7Av2Ew	2026-03-13 10:57:53.954	2026-01-12 10:57:53.955007	\N
qggen6l1q419vjfxsvzwwv1x	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$ijDLE3Q9aST6iE8QJGx+EYlbvymIsIU9bACJa8DiHOs$tBwNbcQAAQWWBwHjqSM4taZzEleQEdDN3gmJH/QNvPI	2026-03-17 05:53:00.989	2026-01-16 05:53:00.98981	\N
n3uvu6grca1uj011pkrqic2t	po2vul7bqa4l1gtpcf0c0pdn	$argon2id$v=19$m=65536,t=2,p=1$W7Lrt5yUmPIPyY4gupuBgs9bsX6JMyJK/w0GxTgMVfE$UCKdQJHry7JT/tVs9i+u5bXfRK9VB4T3HY7MRNOqMTg	2026-03-17 10:59:14.34	2026-01-16 10:59:14.340953	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, name, description, created_at, updated_at) FROM stdin;
q5q2vwvdo1pciiagb6b6d0oz	super-admin	Super Admin	Has full access to the system and can manage all features and settings	2025-12-28 18:53:21.564853	2025-12-28 18:53:21.564853
\.


--
-- Data for Name: roles_to_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles_to_users ("userId", "roleId") FROM stdin;
po2vul7bqa4l1gtpcf0c0pdn	q5q2vwvdo1pciiagb6b6d0oz
\.


--
-- Data for Name: ujian; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: ujian_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ujian_answers (id, attempt_id, question_id, user_answer, is_correct, points_earned, answered_at) FROM stdin;
\.


--
-- Data for Name: ujian_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ujian_attempts (id, ujian_id, user_id, started_at, completed_at, score, total_points, status, created_at) FROM stdin;
\.


--
-- Data for Name: ujian_questions; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: user_notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_notification_preferences (id, user_id, category, channel, enabled, delivery_window, source, created_at, updated_at) FROM stdin;
ji0fuaheyybd7pqco2ug3m3n	po2vul7bqa4l1gtpcf0c0pdn	general	inApp	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
bm71tsnvqit2hdrv713kf4ol	po2vul7bqa4l1gtpcf0c0pdn	general	email	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
k8mlwuks13gviebrzcnlrlxt	po2vul7bqa4l1gtpcf0c0pdn	general	whatsapp	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
q0m760to0xf5ia3i37hgnpnx	po2vul7bqa4l1gtpcf0c0pdn	system	inApp	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
e4gfflpzc41v2cps856wizjy	po2vul7bqa4l1gtpcf0c0pdn	system	email	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
go3gyny1dw6sukbbg89entlv	po2vul7bqa4l1gtpcf0c0pdn	system	whatsapp	t	null	default	2025-12-28 18:53:21.660344+00	2025-12-28 18:53:21.660344+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, username, email, password, is_enable, created_at, updated_at, deleted_at, phone_number, theme_mode, color_scheme) FROM stdin;
po2vul7bqa4l1gtpcf0c0pdn	Super Admin	superadmin	\N	$2b$10$KyraAWiPpvwOFz/pRoZwKO2xgJbom1lJ5QI01ZuMLHLKHpNkPSS5m	t	2025-12-28 18:53:21.618774	2025-12-28 18:53:21.618774	\N	\N	light	default
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 23, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_unique UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: job_executions job_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_executions
    ADD CONSTRAINT job_executions_pkey PRIMARY KEY (id);


--
-- Name: job_schedules job_schedules_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_schedules
    ADD CONSTRAINT job_schedules_name_unique UNIQUE (name);


--
-- Name: job_schedules job_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_schedules
    ADD CONSTRAINT job_schedules_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: kv_store kv_store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kv_store
    ADD CONSTRAINT kv_store_pkey PRIMARY KEY (key);


--
-- Name: microsoft_admin_tokens microsoft_admin_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_admin_tokens
    ADD CONSTRAINT microsoft_admin_tokens_pkey PRIMARY KEY (id);


--
-- Name: oauth_microsoft microsoft_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_microsoft
    ADD CONSTRAINT microsoft_users_pkey PRIMARY KEY (id);


--
-- Name: money_accounts money_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_accounts
    ADD CONSTRAINT money_accounts_pkey PRIMARY KEY (id);


--
-- Name: money_budgets money_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_budgets
    ADD CONSTRAINT money_budgets_pkey PRIMARY KEY (id);


--
-- Name: money_categories money_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_categories
    ADD CONSTRAINT money_categories_pkey PRIMARY KEY (id);


--
-- Name: money_saving_logs money_saving_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_saving_logs
    ADD CONSTRAINT money_saving_logs_pkey PRIMARY KEY (id);


--
-- Name: money_savings money_savings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_savings
    ADD CONSTRAINT money_savings_pkey PRIMARY KEY (id);


--
-- Name: money_transactions money_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_transactions
    ADD CONSTRAINT money_transactions_pkey PRIMARY KEY (id);


--
-- Name: notification_action_logs notification_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_action_logs
    ADD CONSTRAINT notification_action_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_actions notification_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_actions
    ADD CONSTRAINT notification_actions_pkey PRIMARY KEY (id);


--
-- Name: notification_channel_overrides notification_channel_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_channel_overrides
    ADD CONSTRAINT notification_channel_overrides_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_google oauth_google_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_google
    ADD CONSTRAINT oauth_google_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_unique UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions_to_roles permissions_to_roles_roleId_permissionId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_roles
    ADD CONSTRAINT "permissions_to_roles_roleId_permissionId_pk" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: permissions_to_users permissions_to_users_userId_permissionId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_users
    ADD CONSTRAINT "permissions_to_users_userId_permissionId_pk" PRIMARY KEY ("userId", "permissionId");


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_unique UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles_to_users roles_to_users_userId_roleId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_to_users
    ADD CONSTRAINT "roles_to_users_userId_roleId_pk" PRIMARY KEY ("userId", "roleId");


--
-- Name: ujian_answers ujian_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_answers
    ADD CONSTRAINT ujian_answers_pkey PRIMARY KEY (id);


--
-- Name: ujian_attempts ujian_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_attempts
    ADD CONSTRAINT ujian_attempts_pkey PRIMARY KEY (id);


--
-- Name: ujian ujian_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian
    ADD CONSTRAINT ujian_pkey PRIMARY KEY (id);


--
-- Name: ujian_questions ujian_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_questions
    ADD CONSTRAINT ujian_questions_pkey PRIMARY KEY (id);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_money_accounts_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_accounts_is_active ON public.money_accounts USING btree (is_active);


--
-- Name: idx_money_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_accounts_user_id ON public.money_accounts USING btree (user_id);


--
-- Name: idx_money_budgets_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_budgets_category_id ON public.money_budgets USING btree (category_id);


--
-- Name: idx_money_budgets_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_budgets_is_active ON public.money_budgets USING btree (is_active);


--
-- Name: idx_money_budgets_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_budgets_period ON public.money_budgets USING btree (period);


--
-- Name: idx_money_budgets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_budgets_user_id ON public.money_budgets USING btree (user_id);


--
-- Name: idx_money_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_categories_is_active ON public.money_categories USING btree (is_active);


--
-- Name: idx_money_categories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_categories_parent_id ON public.money_categories USING btree (parent_id);


--
-- Name: idx_money_categories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_categories_type ON public.money_categories USING btree (type);


--
-- Name: idx_money_categories_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_categories_user_id ON public.money_categories USING btree (user_id);


--
-- Name: idx_money_saving_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_saving_logs_date ON public.money_saving_logs USING btree (date);


--
-- Name: idx_money_saving_logs_saving_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_saving_logs_saving_id ON public.money_saving_logs USING btree (saving_id);


--
-- Name: idx_money_savings_is_achieved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_savings_is_achieved ON public.money_savings USING btree (is_achieved);


--
-- Name: idx_money_savings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_savings_user_id ON public.money_savings USING btree (user_id);


--
-- Name: idx_money_transactions_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_account_id ON public.money_transactions USING btree (account_id);


--
-- Name: idx_money_transactions_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_category_id ON public.money_transactions USING btree (category_id);


--
-- Name: idx_money_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_date ON public.money_transactions USING btree (date);


--
-- Name: idx_money_transactions_to_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_to_account_id ON public.money_transactions USING btree (to_account_id);


--
-- Name: idx_money_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_type ON public.money_transactions USING btree (type);


--
-- Name: idx_money_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_money_transactions_user_id ON public.money_transactions USING btree (user_id);


--
-- Name: idx_notification_action_logs_notification_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_action_logs_notification_id ON public.notification_action_logs USING btree (notification_id);


--
-- Name: idx_notification_actions_notification_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_actions_notification_id ON public.notification_actions USING btree (notification_id);


--
-- Name: idx_notification_channel_overrides_category_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_notification_channel_overrides_category_channel ON public.notification_channel_overrides USING btree (category, channel);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (user_id, created_at);


--
-- Name: idx_notifications_group_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_group_key ON public.notifications USING btree (user_id, group_key);


--
-- Name: idx_notifications_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_status ON public.notifications USING btree (user_id, status);


--
-- Name: idx_ujian_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_active ON public.ujian USING btree (is_active);


--
-- Name: idx_ujian_answers_attempt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_answers_attempt ON public.ujian_answers USING btree (attempt_id);


--
-- Name: idx_ujian_answers_attempt_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_answers_attempt_question ON public.ujian_answers USING btree (attempt_id, question_id);


--
-- Name: idx_ujian_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_attempts_status ON public.ujian_attempts USING btree (status);


--
-- Name: idx_ujian_attempts_user_ujian; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_attempts_user_ujian ON public.ujian_attempts USING btree (user_id, ujian_id);


--
-- Name: idx_ujian_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_created_by ON public.ujian USING btree (created_by);


--
-- Name: idx_ujian_questions_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_questions_order ON public.ujian_questions USING btree (ujian_id, order_index);


--
-- Name: idx_ujian_questions_ujian_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ujian_questions_ujian_id ON public.ujian_questions USING btree (ujian_id);


--
-- Name: idx_user_notification_preferences_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notification_preferences_category ON public.user_notification_preferences USING btree (category);


--
-- Name: idx_user_notification_preferences_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notification_preferences_channel ON public.user_notification_preferences USING btree (channel);


--
-- Name: idx_user_notification_preferences_user_category_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_notification_preferences_user_category_channel ON public.user_notification_preferences USING btree (user_id, category, channel);


--
-- Name: job_executions job_executions_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_executions
    ADD CONSTRAINT job_executions_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: money_accounts money_accounts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_accounts
    ADD CONSTRAINT money_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: money_budgets money_budgets_category_id_money_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_budgets
    ADD CONSTRAINT money_budgets_category_id_money_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.money_categories(id) ON DELETE SET NULL;


--
-- Name: money_budgets money_budgets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_budgets
    ADD CONSTRAINT money_budgets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: money_categories money_categories_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_categories
    ADD CONSTRAINT money_categories_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: money_saving_logs money_saving_logs_saving_id_money_savings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_saving_logs
    ADD CONSTRAINT money_saving_logs_saving_id_money_savings_id_fk FOREIGN KEY (saving_id) REFERENCES public.money_savings(id) ON DELETE CASCADE;


--
-- Name: money_savings money_savings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_savings
    ADD CONSTRAINT money_savings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: money_transactions money_transactions_account_id_money_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_transactions
    ADD CONSTRAINT money_transactions_account_id_money_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.money_accounts(id) ON DELETE CASCADE;


--
-- Name: money_transactions money_transactions_category_id_money_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_transactions
    ADD CONSTRAINT money_transactions_category_id_money_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.money_categories(id) ON DELETE SET NULL;


--
-- Name: money_transactions money_transactions_to_account_id_money_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_transactions
    ADD CONSTRAINT money_transactions_to_account_id_money_accounts_id_fk FOREIGN KEY (to_account_id) REFERENCES public.money_accounts(id) ON DELETE SET NULL;


--
-- Name: money_transactions money_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.money_transactions
    ADD CONSTRAINT money_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_action_logs notification_action_logs_acted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_action_logs
    ADD CONSTRAINT notification_action_logs_acted_by_users_id_fk FOREIGN KEY (acted_by) REFERENCES public.users(id);


--
-- Name: notification_action_logs notification_action_logs_notification_id_notifications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_action_logs
    ADD CONSTRAINT notification_action_logs_notification_id_notifications_id_fk FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_actions notification_actions_notification_id_notifications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_actions
    ADD CONSTRAINT notification_actions_notification_id_notifications_id_fk FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_google oauth_google_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_google
    ADD CONSTRAINT oauth_google_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: oauth_microsoft oauth_microsoft_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_microsoft
    ADD CONSTRAINT oauth_microsoft_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: permissions_to_roles permissions_to_roles_permissionId_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_roles
    ADD CONSTRAINT "permissions_to_roles_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: permissions_to_roles permissions_to_roles_roleId_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_roles
    ADD CONSTRAINT "permissions_to_roles_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: permissions_to_users permissions_to_users_permissionId_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_users
    ADD CONSTRAINT "permissions_to_users_permissionId_permissions_id_fk" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: permissions_to_users permissions_to_users_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions_to_users
    ADD CONSTRAINT "permissions_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: roles_to_users roles_to_users_roleId_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_to_users
    ADD CONSTRAINT "roles_to_users_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles_to_users roles_to_users_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_to_users
    ADD CONSTRAINT "roles_to_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ujian_answers ujian_answers_attempt_id_ujian_attempts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_answers
    ADD CONSTRAINT ujian_answers_attempt_id_ujian_attempts_id_fk FOREIGN KEY (attempt_id) REFERENCES public.ujian_attempts(id) ON DELETE CASCADE;


--
-- Name: ujian_answers ujian_answers_question_id_ujian_questions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_answers
    ADD CONSTRAINT ujian_answers_question_id_ujian_questions_id_fk FOREIGN KEY (question_id) REFERENCES public.ujian_questions(id);


--
-- Name: ujian_attempts ujian_attempts_ujian_id_ujian_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_attempts
    ADD CONSTRAINT ujian_attempts_ujian_id_ujian_id_fk FOREIGN KEY (ujian_id) REFERENCES public.ujian(id) ON DELETE CASCADE;


--
-- Name: ujian_attempts ujian_attempts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_attempts
    ADD CONSTRAINT ujian_attempts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ujian ujian_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian
    ADD CONSTRAINT ujian_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: ujian_questions ujian_questions_ujian_id_ujian_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ujian_questions
    ADD CONSTRAINT ujian_questions_ujian_id_ujian_id_fk FOREIGN KEY (ujian_id) REFERENCES public.ujian(id) ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6UUuojC4Oq09dPEWHzWEjAm9MM7X0KJlHfP7Sf7rtZEQBXCkLuPmINx5MKnTV2S

