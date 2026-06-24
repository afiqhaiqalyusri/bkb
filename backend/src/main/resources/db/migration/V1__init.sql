--
-- PostgreSQL database dump
--

\restrict 8oJs3jfzBTrvfmtZCRP5kWeJuXajYaJduGd4I6NMdtYN12cQa16zBSoH0Uzi9rd

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: discount_type; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.discount_type AS ENUM (
    'PERCENT',
    'FIXED'
);


ALTER TYPE public.discount_type OWNER TO bkb_user;

--
-- Name: ingredient_level; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.ingredient_level AS ENUM (
    'NONE',
    'LESS',
    'MEDIUM',
    'EXTRA'
);


ALTER TYPE public.ingredient_level OWNER TO bkb_user;

--
-- Name: inventory_status; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.inventory_status AS ENUM (
    'GOOD',
    'LOW',
    'CRITICAL'
);


ALTER TYPE public.inventory_status OWNER TO bkb_user;

--
-- Name: inventory_tx_type; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.inventory_tx_type AS ENUM (
    'DEDUCT',
    'RESTOCK',
    'WASTE',
    'ADJUST'
);


ALTER TYPE public.inventory_tx_type OWNER TO bkb_user;

--
-- Name: loyalty_tx_type; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.loyalty_tx_type AS ENUM (
    'EARN',
    'REDEEM'
);


ALTER TYPE public.loyalty_tx_type OWNER TO bkb_user;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'GRILLING',
    'ASSEMBLING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.order_status OWNER TO bkb_user;

--
-- Name: payment_method_enum; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.payment_method_enum AS ENUM (
    'FPX',
    'CASH'
);


ALTER TYPE public.payment_method_enum OWNER TO bkb_user;

--
-- Name: payment_method_type; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.payment_method_type AS ENUM (
    'ONLINE',
    'CASH'
);


ALTER TYPE public.payment_method_type OWNER TO bkb_user;

--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public.payment_status_enum OWNER TO bkb_user;

--
-- Name: payment_status_type; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.payment_status_type AS ENUM (
    'UNPAID',
    'PAID',
    'FAILED'
);


ALTER TYPE public.payment_status_type OWNER TO bkb_user;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: bkb_user
--

CREATE TYPE public.user_role AS ENUM (
    'CUSTOMER',
    'STAFF',
    'MANAGER',
    'GUEST',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO bkb_user;

--
-- Name: update_inventory_status(); Type: FUNCTION; Schema: public; Owner: bkb_user
--

CREATE FUNCTION public.update_inventory_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.current_stock <= NEW.min_stock * 0.5 THEN
        NEW.status := 'CRITICAL';
    ELSIF NEW.current_stock <= NEW.min_stock THEN
        NEW.status := 'LOW';
    ELSE
        NEW.status := 'GOOD';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_inventory_status() OWNER TO bkb_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO bkb_user;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO bkb_user;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO bkb_user;

--
-- Name: ingredient_outages; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.ingredient_outages (
    name character varying(100) NOT NULL,
    out_of_stock boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ingredient_outages OWNER TO bkb_user;

--
-- Name: invalidated_tokens; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.invalidated_tokens (
    id bigint NOT NULL,
    token character varying(1000) NOT NULL,
    expiry timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invalidated_tokens OWNER TO bkb_user;

--
-- Name: invalidated_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.invalidated_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invalidated_tokens_id_seq OWNER TO bkb_user;

--
-- Name: invalidated_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.invalidated_tokens_id_seq OWNED BY public.invalidated_tokens.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.inventory (
    id bigint NOT NULL,
    item_name character varying(150) NOT NULL,
    category character varying(80),
    unit character varying(30),
    current_stock numeric(10,2) NOT NULL,
    min_stock numeric(10,2) NOT NULL,
    max_stock numeric(10,2) NOT NULL,
    status public.inventory_status DEFAULT 'GOOD'::public.inventory_status NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT inventory_current_stock_check CHECK ((current_stock >= (0)::numeric)),
    CONSTRAINT inventory_max_stock_check CHECK ((max_stock >= (0)::numeric)),
    CONSTRAINT inventory_min_stock_check CHECK ((min_stock >= (0)::numeric))
);


ALTER TABLE public.inventory OWNER TO bkb_user;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO bkb_user;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.inventory_transactions (
    id bigint NOT NULL,
    inventory_id bigint NOT NULL,
    type public.inventory_tx_type NOT NULL,
    quantity numeric(10,2) NOT NULL,
    reason text,
    order_id bigint,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory_transactions OWNER TO bkb_user;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO bkb_user;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: loyalty_accounts; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.loyalty_accounts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    total_earned integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT loyalty_accounts_points_check CHECK ((points >= 0))
);


ALTER TABLE public.loyalty_accounts OWNER TO bkb_user;

--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.loyalty_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loyalty_accounts_id_seq OWNER TO bkb_user;

--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.loyalty_accounts_id_seq OWNED BY public.loyalty_accounts.id;


--
-- Name: loyalty_rewards; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.loyalty_rewards (
    id bigint NOT NULL,
    menu_item_id bigint,
    name character varying(150) NOT NULL,
    points_cost integer NOT NULL,
    is_active boolean DEFAULT true,
    description text,
    image_url text,
    CONSTRAINT loyalty_rewards_points_cost_check CHECK ((points_cost > 0))
);


ALTER TABLE public.loyalty_rewards OWNER TO bkb_user;

--
-- Name: loyalty_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.loyalty_rewards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loyalty_rewards_id_seq OWNER TO bkb_user;

--
-- Name: loyalty_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.loyalty_rewards_id_seq OWNED BY public.loyalty_rewards.id;


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.loyalty_transactions (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    type public.loyalty_tx_type NOT NULL,
    points integer NOT NULL,
    order_id bigint,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.loyalty_transactions OWNER TO bkb_user;

--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.loyalty_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loyalty_transactions_id_seq OWNER TO bkb_user;

--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.loyalty_transactions_id_seq OWNED BY public.loyalty_transactions.id;


--
-- Name: menu_item_ingredients; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.menu_item_ingredients (
    id bigint NOT NULL,
    menu_item_id bigint NOT NULL,
    ingredient_name character varying(100) NOT NULL,
    default_level public.ingredient_level DEFAULT 'MEDIUM'::public.ingredient_level
);


ALTER TABLE public.menu_item_ingredients OWNER TO bkb_user;

--
-- Name: menu_item_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.menu_item_ingredients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_item_ingredients_id_seq OWNER TO bkb_user;

--
-- Name: menu_item_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.menu_item_ingredients_id_seq OWNED BY public.menu_item_ingredients.id;


--
-- Name: menu_item_inventory; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.menu_item_inventory (
    menu_item_id bigint NOT NULL,
    inventory_id bigint NOT NULL,
    quantity_used numeric(10,2) NOT NULL,
    CONSTRAINT menu_item_inventory_quantity_used_check CHECK ((quantity_used > (0)::numeric))
);


ALTER TABLE public.menu_item_inventory OWNER TO bkb_user;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.menu_items (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    promo_price numeric(10,2),
    category character varying(80),
    image_url text,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT menu_items_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT menu_items_promo_price_check CHECK ((promo_price >= (0)::numeric))
);


ALTER TABLE public.menu_items OWNER TO bkb_user;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.menu_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO bkb_user;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    menu_item_id bigint,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    customisations jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.order_items OWNER TO bkb_user;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO bkb_user;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_number character varying(20) NOT NULL,
    user_id bigint,
    guest_name character varying(100),
    guest_phone character varying(20),
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    payment_method public.payment_method_type DEFAULT 'CASH'::public.payment_method_type NOT NULL,
    payment_status public.payment_status_type DEFAULT 'UNPAID'::public.payment_status_type NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    pickup_time timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    payment_token character varying(100),
    payment_channel character varying(50)
);


ALTER TABLE public.orders OWNER TO bkb_user;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO bkb_user;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    transaction_ref character varying(100),
    method public.payment_method_enum DEFAULT 'CASH'::public.payment_method_enum NOT NULL,
    amount numeric(10,2) NOT NULL,
    status public.payment_status_enum DEFAULT 'PENDING'::public.payment_status_enum NOT NULL,
    receipt_url text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.payments OWNER TO bkb_user;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO bkb_user;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.promotions (
    id bigint NOT NULL,
    title character varying(200),
    description text,
    discount_type public.discount_type DEFAULT 'PERCENT'::public.discount_type NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    CONSTRAINT promotions_discount_value_check CHECK ((discount_value >= (0)::numeric))
);


ALTER TABLE public.promotions OWNER TO bkb_user;

--
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.promotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotions_id_seq OWNER TO bkb_user;

--
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.security_logs (
    id bigint NOT NULL,
    user_id bigint,
    user_email character varying(150),
    user_role character varying(50),
    action character varying(255) NOT NULL,
    details text,
    previous_value text,
    new_value text,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.security_logs OWNER TO bkb_user;

--
-- Name: security_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.security_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_logs_id_seq OWNER TO bkb_user;

--
-- Name: security_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.security_logs_id_seq OWNED BY public.security_logs.id;


--
-- Name: staff_documents; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.staff_documents (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    ic_number character varying(20),
    typhoid_expiry date,
    food_handler_expiry date,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    notes text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff_documents OWNER TO bkb_user;

--
-- Name: staff_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.staff_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_documents_id_seq OWNER TO bkb_user;

--
-- Name: staff_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.staff_documents_id_seq OWNED BY public.staff_documents.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bkb_user
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'CUSTOMER'::public.user_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO bkb_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bkb_user
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO bkb_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bkb_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: invalidated_tokens id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.invalidated_tokens ALTER COLUMN id SET DEFAULT nextval('public.invalidated_tokens_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: loyalty_accounts id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_accounts ALTER COLUMN id SET DEFAULT nextval('public.loyalty_accounts_id_seq'::regclass);


--
-- Name: loyalty_rewards id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_rewards ALTER COLUMN id SET DEFAULT nextval('public.loyalty_rewards_id_seq'::regclass);


--
-- Name: loyalty_transactions id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_transactions ALTER COLUMN id SET DEFAULT nextval('public.loyalty_transactions_id_seq'::regclass);


--
-- Name: menu_item_ingredients id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_ingredients ALTER COLUMN id SET DEFAULT nextval('public.menu_item_ingredients_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- Name: security_logs id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.security_logs ALTER COLUMN id SET DEFAULT nextval('public.security_logs_id_seq'::regclass);


--
-- Name: staff_documents id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.staff_documents ALTER COLUMN id SET DEFAULT nextval('public.staff_documents_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.categories (id, name, display_order, created_at) FROM stdin;
1	Burger	1	2026-06-04 12:34:46.325656
2	Oblong	2	2026-06-04 12:34:46.325656
4	Drinks	4	2026-06-04 12:34:46.325656
6	Maggi	5	2026-06-07 14:20:40.692074
7	Western	5	2026-06-07 14:23:30.298548
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	schema	SQL	V1__schema.sql	-658082921	bkb_user	2026-06-03 03:02:12.234593	482	t
2	2	seed	SQL	V2__seed.sql	1881970179	bkb_user	2026-06-03 03:02:12.736372	17	t
3	3	fix passwords	SQL	V3__fix_passwords.sql	-1307643558	bkb_user	2026-06-03 03:21:25.853419	7	t
4	4	ingredient outages	SQL	V4__ingredient_outages.sql	1434017231	bkb_user	2026-06-04 02:32:46.029696	17	t
5	5	categories staff docs	SQL	V5__categories_staff_docs.sql	-1331147388	bkb_user	2026-06-04 12:34:46.314163	51	t
6	6	add admin role	SQL	V6__add_admin_role.sql	-723939607	bkb_user	2026-06-04 12:45:14.362213	5	t
7	7	seed admin	SQL	V7__seed_admin.sql	-345242667	bkb_user	2026-06-04 12:45:14.381096	5	t
8	8	fix admin password	SQL	V8__fix_admin_password.sql	1494980519	bkb_user	2026-06-04 12:50:08.373894	5	t
9	9	reactivate manager	SQL	V9__reactivate_manager.sql	-1375973365	bkb_user	2026-06-04 12:54:26.091243	5	t
10	10	add payment token	SQL	V10__add_payment_token.sql	-9178774	bkb_user	2026-06-05 03:37:35.676855	15	t
11	11	add loyalty reward details	SQL	V11__add_loyalty_reward_details.sql	1164496360	bkb_user	2026-06-05 13:12:25.981844	15	t
12	12	add invalidated tokens	SQL	V12__add_invalidated_tokens.sql	-397584521	bkb_user	2026-06-05 14:52:20.995701	28	t
13	13	add security logs	SQL	V13__add_security_logs.sql	-1565561264	bkb_user	2026-06-05 17:30:43.653873	54	t
14	14	add deleted to menu items	SQL	V14__add_deleted_to_menu_items.sql	-1940794613	bkb_user	2026-06-09 13:18:02.336977	16	t
\.


--
-- Data for Name: ingredient_outages; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.ingredient_outages (name, out_of_stock) FROM stdin;
Tomatoes	f
Shredded Salad	f
Cucumber	f
Cheese	f
Black Pepper	f
Chilli	f
Mayo	f
Egg	f
Caramelized Onion	f
\.


--
-- Data for Name: invalidated_tokens; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.invalidated_tokens (id, token, expiry, created_at) FROM stdin;
112	eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQURNSU4iLCJ1c2VySWQiOjgsInN1YiI6ImFkbWluQGJrYi5jb20iLCJpYXQiOjE3ODEzMzg3MTQsImV4cCI6MTc4MTMzOTYxNH0.XjB8O-n1GXd8AWgfTFtVRTbip8mBFZ5gk0iyHDWVEDJT0zbjuVfpKuqENovss8gO	2026-06-13 16:33:34	2026-06-13 16:19:09.018614
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.inventory (id, item_name, category, unit, current_stock, min_stock, max_stock, status, updated_at) FROM stdin;
8	Lettuce	Vegetables	kg	8.00	5.00	50.00	GOOD	2026-06-03 03:02:12.74455
9	Tomatoes	Vegetables	kg	25.00	10.00	60.00	GOOD	2026-06-03 03:02:12.74455
10	Eggs	Dairy	pcs	100.00	30.00	200.00	GOOD	2026-06-03 03:02:12.74455
11	Mayonnaise	Condiments	kg	5.00	2.00	20.00	GOOD	2026-06-03 03:02:12.74455
12	Black Pepper Sauce	Condiments	kg	4.00	2.00	20.00	GOOD	2026-06-03 03:02:12.74455
13	Caramelised Onion	Condiments	kg	3.00	2.00	15.00	GOOD	2026-06-03 03:02:12.74455
14	Mint Sauce	Condiments	kg	2.00	1.00	10.00	GOOD	2026-06-03 03:02:12.74455
15	Cooking Oil	Cooking	L	10.00	5.00	30.00	GOOD	2026-06-03 03:02:12.74455
16	Milo Powder	Dry Goods	kg	3.00	2.00	10.00	GOOD	2026-06-03 03:02:12.74455
4	Beef Oblong Patty	Meat	pcs	32.00	50.00	250.00	LOW	2026-06-11 13:20:36.791759
7	Long Buns	Bread	pcs	13.00	60.00	200.00	CRITICAL	2026-06-11 13:20:36.791759
1	Chicken Patty	Meat	pcs	136.00	50.00	300.00	GOOD	2026-06-11 13:25:46.774838
6	Round Buns	Bread	pcs	157.00	60.00	400.00	GOOD	2026-06-11 13:25:46.774838
5	Lamb Patty	Meat	pcs	18.00	20.00	100.00	LOW	2026-06-05 16:11:09.927609
3	Chicken Oblong Patty	Meat	pcs	111.00	50.00	250.00	GOOD	2026-06-11 00:47:11.770735
2	Beef Patty	Meat	pcs	45.00	50.00	300.00	LOW	2026-06-11 12:33:58.823825
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.inventory_transactions (id, inventory_id, type, quantity, reason, order_id, created_by, created_at) FROM stdin;
1	1	DEDUCT	1.00	Order ORD714750	4	\N	2026-06-03 03:25:03.182736
2	6	DEDUCT	1.00	Order ORD714750	4	\N	2026-06-03 03:25:03.188275
3	1	DEDUCT	1.00	Order ORD131595	5	\N	2026-06-03 03:55:20.2116
4	6	DEDUCT	1.00	Order ORD131595	5	\N	2026-06-03 03:55:20.216119
5	1	DEDUCT	1.00	Order ORD629132	6	\N	2026-06-03 03:55:22.102489
6	6	DEDUCT	1.00	Order ORD629132	6	\N	2026-06-03 03:55:22.103589
7	1	DEDUCT	1.00	Order ORD155955	7	\N	2026-06-03 04:00:40.057771
8	6	DEDUCT	1.00	Order ORD155955	7	\N	2026-06-03 04:00:40.059402
9	4	DEDUCT	1.00	Order ORD678677	8	\N	2026-06-03 04:32:47.62682
10	7	DEDUCT	1.00	Order ORD678677	8	\N	2026-06-03 04:32:47.631928
11	2	DEDUCT	1.00	Order ORD581466	9	\N	2026-06-03 14:11:29.505272
12	6	DEDUCT	1.00	Order ORD581466	9	\N	2026-06-03 14:11:29.510356
13	2	DEDUCT	1.00	Order ORD778608	10	\N	2026-06-03 15:04:33.533557
14	6	DEDUCT	1.00	Order ORD778608	10	\N	2026-06-03 15:04:33.535197
15	4	DEDUCT	1.00	Order ORD693715	11	\N	2026-06-03 15:56:05.991102
16	7	DEDUCT	1.00	Order ORD693715	11	\N	2026-06-03 15:56:05.993862
17	1	DEDUCT	2.00	Order ORD693715	11	\N	2026-06-03 15:56:06.020592
18	6	DEDUCT	1.00	Order ORD693715	11	\N	2026-06-03 15:56:06.022175
19	2	DEDUCT	1.00	Order ORD263396	12	\N	2026-06-03 16:21:13.104764
20	6	DEDUCT	1.00	Order ORD263396	12	\N	2026-06-03 16:21:13.106891
21	2	DEDUCT	2.00	Order ORD785962	13	\N	2026-06-03 16:38:33.370778
22	6	DEDUCT	2.00	Order ORD785962	13	\N	2026-06-03 16:38:33.37329
23	2	DEDUCT	1.00	Order ORD683123	14	\N	2026-06-03 16:59:41.048596
24	6	DEDUCT	1.00	Order ORD683123	14	\N	2026-06-03 16:59:41.051115
25	2	DEDUCT	2.00	Order ORD683123	14	\N	2026-06-03 16:59:41.059114
26	6	DEDUCT	1.00	Order ORD683123	14	\N	2026-06-03 16:59:41.060622
31	2	DEDUCT	2.00	Order ORD673202	17	\N	2026-06-03 21:00:02.688522
32	6	DEDUCT	1.00	Order ORD673202	17	\N	2026-06-03 21:00:02.69476
33	2	DEDUCT	2.00	Order ORD407084	18	\N	2026-06-03 22:58:08.30384
34	6	DEDUCT	2.00	Order ORD407084	18	\N	2026-06-03 22:58:08.305362
35	2	DEDUCT	1.00	Order ORD472761	19	\N	2026-06-04 13:05:08.075459
36	6	DEDUCT	1.00	Order ORD472761	19	\N	2026-06-04 13:05:08.077532
37	4	DEDUCT	4.00	Order ORD896886	20	\N	2026-06-04 14:37:44.264183
38	7	DEDUCT	2.00	Order ORD896886	20	\N	2026-06-04 14:37:44.267738
39	5	DEDUCT	2.00	Order ORD762135	21	\N	2026-06-04 14:39:51.266965
40	6	DEDUCT	2.00	Order ORD762135	21	\N	2026-06-04 14:39:51.267959
41	4	DEDUCT	2.00	Order ORD377626	22	\N	2026-06-04 15:59:45.36663
42	7	DEDUCT	1.00	Order ORD377626	22	\N	2026-06-04 15:59:45.368195
43	5	DEDUCT	1.00	Order ORD377626	22	\N	2026-06-04 15:59:45.390216
44	6	DEDUCT	1.00	Order ORD377626	22	\N	2026-06-04 15:59:45.391261
45	4	DEDUCT	2.00	Order ORD377626	22	\N	2026-06-04 15:59:45.397955
46	7	DEDUCT	1.00	Order ORD377626	22	\N	2026-06-04 15:59:45.398966
47	4	DEDUCT	2.00	Order ORD959485	23	\N	2026-06-04 16:26:54.06191
48	7	DEDUCT	1.00	Order ORD959485	23	\N	2026-06-04 16:26:54.062909
49	5	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.937356
50	6	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.939862
51	2	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.949017
52	6	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.950024
53	1	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.955092
54	6	DEDUCT	1.00	Order ORD312519	24	\N	2026-06-04 17:35:40.956919
55	1	DEDUCT	1.00	Order ORD478359	25	\N	2026-06-04 22:31:09.072856
56	6	DEDUCT	1.00	Order ORD478359	25	\N	2026-06-04 22:31:09.082113
57	2	DEDUCT	1.00	Order ORD455659	26	\N	2026-06-04 22:33:18.686646
58	6	DEDUCT	1.00	Order ORD455659	26	\N	2026-06-04 22:33:18.690513
59	3	DEDUCT	2.00	Order ORD455659	26	\N	2026-06-04 22:33:18.704554
60	7	DEDUCT	1.00	Order ORD455659	26	\N	2026-06-04 22:33:18.709511
61	5	DEDUCT	1.00	Order ORD752194	27	\N	2026-06-04 22:33:59.126489
62	6	DEDUCT	1.00	Order ORD752194	27	\N	2026-06-04 22:33:59.133919
63	1	DEDUCT	1.00	Order ORD114515	28	\N	2026-06-05 03:04:54.32998
64	6	DEDUCT	1.00	Order ORD114515	28	\N	2026-06-05 03:04:54.33249
65	4	DEDUCT	2.00	Order ORD114515	28	\N	2026-06-05 03:04:54.356899
66	7	DEDUCT	1.00	Order ORD114515	28	\N	2026-06-05 03:04:54.358615
67	5	DEDUCT	1.00	Order ORD114515	28	\N	2026-06-05 03:04:54.364497
68	6	DEDUCT	1.00	Order ORD114515	28	\N	2026-06-05 03:04:54.365055
69	4	DEDUCT	2.00	Order ORD626278	29	\N	2026-06-05 03:36:11.825755
70	7	DEDUCT	1.00	Order ORD626278	29	\N	2026-06-05 03:36:11.830688
71	5	DEDUCT	1.00	Order ORD947200	30	\N	2026-06-05 03:36:31.199032
72	6	DEDUCT	1.00	Order ORD947200	30	\N	2026-06-05 03:36:31.201772
73	4	DEDUCT	2.00	Order ORD192692	31	\N	2026-06-05 03:39:38.198204
74	7	DEDUCT	1.00	Order ORD192692	31	\N	2026-06-05 03:39:38.202766
75	7	DEDUCT	1.00	Order ORD387094	32	\N	2026-06-05 03:45:32.968823
76	4	DEDUCT	2.00	Order ORD387094	32	\N	2026-06-05 03:45:32.97328
77	4	DEDUCT	2.00	Order ORD107805	33	\N	2026-06-05 13:29:36.108625
78	7	DEDUCT	1.00	Order ORD107805	33	\N	2026-06-05 13:29:36.111785
79	4	DEDUCT	2.00	Order ORD355759	34	\N	2026-06-05 13:29:46.599134
80	7	DEDUCT	1.00	Order ORD355759	34	\N	2026-06-05 13:29:46.601269
81	5	DEDUCT	1.00	Order ORD137217	35	\N	2026-06-05 13:30:01.436289
82	6	DEDUCT	1.00	Order ORD137217	35	\N	2026-06-05 13:30:01.437847
83	5	DEDUCT	1.00	Order ORD561113	36	\N	2026-06-05 13:32:48.712237
84	6	DEDUCT	1.00	Order ORD561113	36	\N	2026-06-05 13:32:48.713236
85	5	DEDUCT	1.00	Order ORD438215	37	\N	2026-06-05 13:33:15.532404
86	6	DEDUCT	1.00	Order ORD438215	37	\N	2026-06-05 13:33:15.534167
87	5	DEDUCT	1.00	Order ORD485992	38	\N	2026-06-05 14:13:04.49658
88	6	DEDUCT	1.00	Order ORD485992	38	\N	2026-06-05 14:13:04.499478
89	4	DEDUCT	2.00	Order ORD220554	39	\N	2026-06-05 16:03:02.091302
90	7	DEDUCT	1.00	Order ORD220554	39	\N	2026-06-05 16:03:02.093358
91	5	DEDUCT	1.00	Order ORD954333	40	\N	2026-06-05 16:11:09.93713
92	6	DEDUCT	1.00	Order ORD954333	40	\N	2026-06-05 16:11:09.938744
93	4	DEDUCT	2.00	Order ORD669489	41	\N	2026-06-05 17:35:00.058228
94	7	DEDUCT	1.00	Order ORD669489	41	\N	2026-06-05 17:35:00.071719
95	6	DEDUCT	1.00	Order ORD557956	42	\N	2026-06-05 17:39:23.498882
96	1	DEDUCT	1.00	Order ORD557956	42	\N	2026-06-05 17:39:23.504483
97	1	DEDUCT	1.00	Order ORD612302	43	\N	2026-06-05 17:43:46.035891
98	6	DEDUCT	1.00	Order ORD612302	43	\N	2026-06-05 17:43:46.040496
99	7	DEDUCT	1.00	Order ORD612302	43	\N	2026-06-05 17:43:46.060239
100	3	DEDUCT	1.00	Order ORD612302	43	\N	2026-06-05 17:43:46.063897
101	4	DEDUCT	2.00	Order ORD875094	46	\N	2026-06-07 16:02:26.821432
102	7	DEDUCT	1.00	Order ORD875094	46	\N	2026-06-07 16:02:26.831156
103	4	DEDUCT	2.00	Order ORD294953	47	\N	2026-06-07 16:04:16.97142
104	7	DEDUCT	1.00	Order ORD294953	47	\N	2026-06-07 16:04:16.976855
105	6	DEDUCT	1.00	Order ORD751142	48	\N	2026-06-07 16:04:30.512754
106	2	DEDUCT	2.00	Order ORD751142	48	\N	2026-06-07 16:04:30.515083
107	1	DEDUCT	1.00	Order ORD221905	49	\N	2026-06-07 16:08:42.663812
108	6	DEDUCT	1.00	Order ORD221905	49	\N	2026-06-07 16:08:42.667423
109	3	DEDUCT	2.00	Order ORD221905	49	\N	2026-06-07 16:08:42.681285
110	7	DEDUCT	1.00	Order ORD221905	49	\N	2026-06-07 16:08:42.685281
111	1	DEDUCT	1.00	Order ORD141169	50	\N	2026-06-09 01:33:34.144077
112	6	DEDUCT	1.00	Order ORD141169	50	\N	2026-06-09 01:33:34.152941
113	4	DEDUCT	2.00	Order ORD141169	50	\N	2026-06-09 01:33:34.225311
114	7	DEDUCT	1.00	Order ORD141169	50	\N	2026-06-09 01:33:34.231884
115	4	DEDUCT	2.00	Order ORD141169	50	\N	2026-06-09 01:33:34.251625
116	7	DEDUCT	2.00	Order ORD141169	50	\N	2026-06-09 01:33:34.258621
117	3	DEDUCT	1.00	Order ORD141169	50	\N	2026-06-09 01:33:34.291434
118	7	DEDUCT	1.00	Order ORD141169	50	\N	2026-06-09 01:33:34.295431
119	4	DEDUCT	2.00	Order ORD455898	52	\N	2026-06-10 15:33:49.189712
120	7	DEDUCT	1.00	Order ORD455898	52	\N	2026-06-10 15:33:49.201941
121	4	DEDUCT	2.00	Order ORD309946	54	\N	2026-06-10 17:06:15.483713
122	7	DEDUCT	1.00	Order ORD309946	54	\N	2026-06-10 17:06:15.485682
123	3	DEDUCT	2.00	Order ORD417181	55	\N	2026-06-10 19:31:47.602858
124	7	DEDUCT	1.00	Order ORD417181	55	\N	2026-06-10 19:31:47.609946
125	2	DEDUCT	2.00	Order ORD514338	56	\N	2026-06-11 00:29:49.625689
126	6	DEDUCT	1.00	Order ORD514338	56	\N	2026-06-11 00:29:49.629652
127	2	DEDUCT	2.00	Order ORD514338	56	\N	2026-06-11 00:29:49.65036
128	6	DEDUCT	1.00	Order ORD514338	56	\N	2026-06-11 00:29:49.6522
129	3	DEDUCT	1.00	Order ORD111884	58	\N	2026-06-11 00:47:11.776504
130	7	DEDUCT	1.00	Order ORD111884	58	\N	2026-06-11 00:47:11.777513
131	4	DEDUCT	2.00	Order ORD707039	59	\N	2026-06-11 11:43:08.434848
132	7	DEDUCT	1.00	Order ORD707039	59	\N	2026-06-11 11:43:08.447061
133	4	DEDUCT	2.00	Order ORD222813	60	\N	2026-06-11 12:21:29.482106
134	7	DEDUCT	1.00	Order ORD222813	60	\N	2026-06-11 12:21:29.489192
135	4	DEDUCT	2.00	Order ORD529754	61	\N	2026-06-11 12:24:21.391018
136	7	DEDUCT	1.00	Order ORD529754	61	\N	2026-06-11 12:24:21.399171
137	2	DEDUCT	2.00	Order ORD884482	62	\N	2026-06-11 12:29:07.693599
138	6	DEDUCT	1.00	Order ORD884482	62	\N	2026-06-11 12:29:07.696599
139	2	DEDUCT	2.00	Order ORD141485	63	\N	2026-06-11 12:33:58.832379
140	6	DEDUCT	1.00	Order ORD141485	63	\N	2026-06-11 12:33:58.835441
141	4	DEDUCT	2.00	Order ORD400020	64	\N	2026-06-11 13:20:37.300247
142	7	DEDUCT	1.00	Order ORD400020	64	\N	2026-06-11 13:20:37.344982
143	1	DEDUCT	1.00	Order ORD843773	65	\N	2026-06-11 13:25:46.787621
144	6	DEDUCT	1.00	Order ORD843773	65	\N	2026-06-11 13:25:46.791619
\.


--
-- Data for Name: loyalty_accounts; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.loyalty_accounts (id, user_id, points, total_earned, updated_at) FROM stdin;
4	10	0	12345679	2026-06-05 13:14:46.175393
6	12	0	0	2026-06-07 14:18:38.87226
7	13	0	0	2026-06-07 16:07:13.406321
3	7	1166	1406	2026-06-08 21:10:11.204692
8	14	365	405	2026-06-10 15:34:55.114657
9	15	0	0	2026-06-10 15:43:03.174087
10	16	500	500	2026-06-10 17:31:55.934922
11	17	0	0	2026-06-10 22:37:22.086402
12	18	0	0	2026-06-11 00:42:42.370008
13	19	0	0	2026-06-11 11:03:16.680851
14	21	0	0	2026-06-11 11:42:24.426978
15	22	0	0	2026-06-11 12:23:18.547149
5	11	126	9000126	2026-06-11 13:27:31.923419
\.


--
-- Data for Name: loyalty_rewards; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.loyalty_rewards (id, menu_item_id, name, points_cost, is_active, description, image_url) FROM stdin;
1	1	Burger Ramly Ayam Biasa (Free)	400	t	\N	\N
4	11	Milo Ais (Free)	250	t	\N	\N
3	5	Oblong Ayam Biasa (Free)	600	t	\N	\N
2	3	Burger Ramly Daging Biasa (Free)	400	t	\N	\N
\.


--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.loyalty_transactions (id, account_id, type, points, order_id, created_at) FROM stdin;
2	3	EARN	1	14	2026-06-03 16:59:41.06727
3	3	EARN	1	18	2026-06-03 22:58:08.308925
4	3	EARN	1	20	2026-06-04 14:37:44.284451
5	3	EARN	2	22	2026-06-04 15:59:45.406412
6	3	EARN	400	\N	2026-06-04 16:58:09.091391
7	3	REDEEM	-40	\N	2026-06-04 17:08:26.412443
8	3	REDEEM	-40	\N	2026-06-04 17:31:37.834177
9	3	REDEEM	-40	\N	2026-06-04 17:35:37.068179
10	3	EARN	1	24	2026-06-04 17:35:40.961536
11	3	EARN	1000	\N	2026-06-04 17:40:08.609956
12	3	REDEEM	-40	\N	2026-06-04 17:43:17.915447
13	4	EARN	1	26	2026-06-04 22:33:18.727692
14	4	EARN	12345678	\N	2026-06-04 22:59:22.102274
15	4	REDEEM	-40	\N	2026-06-04 22:59:45.960624
16	4	REDEEM	-12345689	\N	2026-06-05 13:14:46.194868
17	5	EARN	9000000	\N	2026-06-05 17:43:09.377985
18	5	REDEEM	-40	\N	2026-06-05 17:43:24.815472
19	5	REDEEM	-15	\N	2026-06-05 17:43:29.252253
20	5	REDEEM	-50	\N	2026-06-05 17:43:31.118501
21	5	REDEEM	-89999995	\N	2026-06-07 12:38:55.08417
22	5	EARN	100	\N	2026-06-07 12:39:26.45301
23	3	REDEEM	-40	\N	2026-06-07 16:08:02.495662
24	3	REDEEM	-40	\N	2026-06-08 21:10:11.206753
25	8	EARN	3	50	2026-06-09 01:33:34.31488
26	8	EARN	400	\N	2026-06-09 01:37:40.759678
27	8	REDEEM	-40	\N	2026-06-09 14:10:17.760781
28	8	EARN	1	52	2026-06-10 15:33:49.329401
29	8	EARN	1	53	2026-06-10 15:34:55.117157
30	10	EARN	500	\N	2026-06-10 17:31:55.93592
31	5	EARN	1	56	2026-06-11 00:29:49.662738
32	5	EARN	12	\N	2026-06-11 13:21:59.261143
33	5	EARN	13	\N	2026-06-11 13:27:31.924416
\.


--
-- Data for Name: menu_item_ingredients; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.menu_item_ingredients (id, menu_item_id, ingredient_name, default_level) FROM stdin;
2	1	Mayonnaise	MEDIUM
3	1	Black Pepper Sauce	MEDIUM
4	1	Lettuce	MEDIUM
5	1	Tomato	MEDIUM
6	1	Egg	MEDIUM
8	2	Mayonnaise	MEDIUM
9	2	Black Pepper Sauce	MEDIUM
10	2	Lettuce	MEDIUM
11	2	Tomato	MEDIUM
12	2	Egg	MEDIUM
14	3	Mayonnaise	MEDIUM
15	3	Black Pepper Sauce	MEDIUM
16	3	Caramelised Onion	MEDIUM
17	3	Lettuce	MEDIUM
18	3	Egg	MEDIUM
20	4	Mayonnaise	MEDIUM
21	4	Black Pepper Sauce	MEDIUM
22	4	Caramelised Onion	MEDIUM
23	4	Lettuce	MEDIUM
24	4	Egg	MEDIUM
25	5	Chicken Oblong Patty	MEDIUM
26	5	Mayonnaise	MEDIUM
27	5	Black Pepper Sauce	MEDIUM
28	5	Lettuce	MEDIUM
29	5	Egg	MEDIUM
30	6	Chicken Oblong Patty	EXTRA
31	6	Mayonnaise	MEDIUM
32	6	Black Pepper Sauce	MEDIUM
33	6	Lettuce	MEDIUM
34	6	Egg	MEDIUM
35	7	Beef Oblong Patty	MEDIUM
36	7	Mayonnaise	MEDIUM
37	7	Black Pepper Sauce	MEDIUM
38	7	Caramelised Onion	MEDIUM
39	7	Egg	MEDIUM
40	8	Beef Oblong Patty	EXTRA
41	8	Mayonnaise	MEDIUM
42	8	Black Pepper Sauce	MEDIUM
43	8	Caramelised Onion	MEDIUM
44	8	Egg	MEDIUM
45	9	Lamb Patty	MEDIUM
46	9	Mint Sauce	MEDIUM
47	9	Caramelised Onion	MEDIUM
48	9	Lettuce	MEDIUM
49	9	Tomato	MEDIUM
50	10	Ice	MEDIUM
52	11	Ice	MEDIUM
53	11	Sugar	MEDIUM
54	1	Chicken Patty	MEDIUM
55	1	Mayonnaise	MEDIUM
56	1	Black Pepper Sauce	MEDIUM
57	1	Lettuce	MEDIUM
58	1	Tomato	MEDIUM
59	1	Egg	MEDIUM
61	3	Mayonnaise	MEDIUM
62	3	Black Pepper Sauce	MEDIUM
63	3	Caramelised Onion	MEDIUM
64	3	Lettuce	MEDIUM
65	3	Egg	MEDIUM
67	2	Mayonnaise	MEDIUM
68	2	Black Pepper Sauce	MEDIUM
69	2	Lettuce	MEDIUM
70	2	Tomato	MEDIUM
71	2	Egg	MEDIUM
\.


--
-- Data for Name: menu_item_inventory; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.menu_item_inventory (menu_item_id, inventory_id, quantity_used) FROM stdin;
1	1	1.00
1	6	1.00
2	1	2.00
2	6	1.00
3	2	1.00
3	6	1.00
4	2	2.00
4	6	1.00
5	3	1.00
5	7	1.00
6	3	2.00
6	7	1.00
7	4	1.00
7	7	1.00
8	4	2.00
8	7	1.00
9	5	1.00
9	6	1.00
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.menu_items (id, name, description, price, promo_price, category, image_url, is_available, created_at, deleted) FROM stdin;
8	Oblong Daging Double	Double oblong beef patty — smoky, juicy, and full of BKB flavour.	6.50	\N	Oblong	\N	t	2026-06-03 03:02:12.74455	f
6	Oblong Ayam Double	Double oblong chicken patty burger — the ultimate BKB chicken experience.	6.50	\N	Oblong	\N	t	2026-06-03 03:02:12.74455	f
4	Burger Ramly Daging Double	Double beef patty Ramly burger loaded with BKB special sauce.	5.50	\N	Burger	\N	t	2026-06-03 03:02:12.74455	f
5	Oblong Ayam Biasa	Oblong chicken patty burger — a BKB signature shape with classic toppings.	5.50	\N	Oblong	\N	t	2026-06-03 03:02:12.74455	f
7	Oblong Daging Biasa	Oblong beef patty burger with BKB black pepper sauce and fresh vegetables.	5.50	\N	Oblong	\N	t	2026-06-03 03:02:12.74455	f
12	Chicken Chop	Chicken Chop with flavourful black pepper sauce 	7.00	\N	Western	\N	t	2026-06-07 14:24:49.899386	f
13	Fish & Chips	Dory Fish coated with breadcrumbs and freshly cut fries 	8.00	\N	Western	\N	t	2026-06-07 14:26:21.539695	f
15	Maggi Patty Daging	Maggi flavour curry with grill beef and black pepper sauce	6.00	\N	Maggi	\N	t	2026-06-07 14:29:02.458828	f
1	Burger Ramly Ayam Biasa	Classic Ramly chicken burger with special BKB sauce, fresh lettuce and tomatoes.	4.00	\N	Burger	\N	t	2026-06-03 03:02:12.74455	f
3	Burger Ramly Daging Biasa	Classic Ramly beef burger with caramelised onions and black pepper sauce.	4.00	\N	Burger	\N	t	2026-06-03 03:02:12.74455	f
2	Burger Ramly Ayam Double	Double chicken patty Ramly burger — double the flavour, double the satisfaction.	5.50	\N	Burger	\N	t	2026-06-03 03:02:12.74455	f
9	Burger Kambing Special	Rare lamb patty burger with mint sauce and caramelised onions — limited availability.	7.90	\N	Special	\N	t	2026-06-03 03:02:12.74455	f
10	Air Sejuk (Iced Water)	Complimentary iced water.	1.00	\N	Drinks	\N	f	2026-06-03 03:02:12.74455	f
14	Maggi Patty Ayam	Maggi flavour curry with grilled chicken patty with black pepper sauce	6.00	\N	Maggi	\N	f	2026-06-07 14:28:04.828547	f
11	Milo Ais	Classic Malaysian iced Milo — cold, creamy, and energising.	3.50	\N	Drinks	\N	t	2026-06-03 03:02:12.74455	f
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.order_items (id, order_id, menu_item_id, quantity, unit_price, customisations) FROM stdin;
1	4	1	1	4.90	[]
2	5	1	1	4.90	[]
3	6	1	1	4.90	[]
4	7	1	1	4.90	[{"level": "LESS", "ingredient": "Chicken Patty"}, {"level": "EXTRA", "ingredient": "Mayonnaise"}, {"level": "EXTRA", "ingredient": "Black Pepper Sauce"}, {"level": "MEDIUM", "ingredient": "Lettuce"}, {"level": "MEDIUM", "ingredient": "Tomato"}, {"level": "EXTRA", "ingredient": "Egg"}]
5	8	7	1	5.50	[]
6	9	3	1	4.90	[{"level": "Medium", "ingredient": "Tomatoes"}, {"level": "Medium", "ingredient": "Shredded Salad"}, {"level": "Medium", "ingredient": "Cucumber"}, {"level": "Medium", "ingredient": "Caramelized Onion"}, {"level": "Medium", "ingredient": "Black Pepper"}, {"level": "None", "ingredient": "Chilli"}, {"level": "Medium", "ingredient": "Mayo"}]
7	10	3	1	4.90	[{"level": "NONE", "ingredient": "Tomatoes"}, {"level": "NONE", "ingredient": "Shredded Salad"}, {"level": "NONE", "ingredient": "Cucumber"}, {"level": "NONE", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "NONE", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
8	11	7	1	5.50	[]
9	11	2	1	4.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
10	12	3	1	4.90	[]
11	13	3	2	4.90	[]
12	14	3	1	4.90	[]
13	14	4	1	5.50	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}]
16	17	4	1	5.50	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "NONE", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
17	18	3	2	4.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
18	19	3	1	4.90	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "EXTRA", "ingredient": "Black Pepper"}, {"level": "EXTRA", "ingredient": "Chilli"}, {"level": "EXTRA", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}]
19	20	8	2	6.50	[]
20	21	9	2	7.90	[]
21	22	8	1	6.50	[]
22	22	9	1	7.90	[]
23	22	8	1	6.50	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "EXTRA", "ingredient": "Black Pepper"}, {"level": "EXTRA", "ingredient": "Chilli"}, {"level": "EXTRA", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}]
24	23	8	1	6.50	[]
25	24	9	1	7.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
26	24	3	1	4.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
27	24	1	1	4.90	[]
28	25	1	1	0.00	[]
29	26	3	1	4.90	[]
30	26	6	1	6.50	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "EXTRA", "ingredient": "Black Pepper"}, {"level": "EXTRA", "ingredient": "Chilli"}, {"level": "EXTRA", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}]
79	62	4	1	5.50	[{"level": "EXTRA", "ingredient": "Mayonnaise"}, {"level": "EXTRA", "ingredient": "Black Pepper Sauce"}, {"level": "EXTRA", "ingredient": "Caramelised Onion"}, {"level": "EXTRA", "ingredient": "Lettuce"}, {"level": "EXTRA", "ingredient": "Egg"}]
31	27	9	1	7.90	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
32	28	1	1	0.00	[]
33	28	8	1	6.50	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
34	28	9	1	7.90	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
35	29	8	1	6.50	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
36	30	10	1	1.00	[]
37	30	9	1	7.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
38	31	8	1	6.50	[]
39	32	8	1	6.50	[]
40	33	8	1	6.50	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
41	34	8	1	6.50	[]
42	35	9	1	7.90	[{"level": "MEDIUM", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}]
43	36	9	1	7.90	[]
44	37	9	1	7.90	[]
45	38	9	1	7.90	[]
46	39	8	1	6.50	[]
47	40	9	1	7.90	[]
48	41	8	1	6.50	[{"level": "NONE", "ingredient": "Tomatoes"}, {"level": "NONE", "ingredient": "Shredded Salad"}, {"level": "NONE", "ingredient": "Cucumber"}, {"level": "NONE", "ingredient": "Caramelized Onion"}, {"level": "LESS", "ingredient": "Black Pepper"}, {"level": "NONE", "ingredient": "Chilli"}, {"level": "NONE", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}, {"level": "taknak burger, nak owner", "ingredient": "Remarks"}]
49	42	1	1	4.90	[]
50	43	1	1	0.00	[{"level": "EXTRA", "ingredient": "Tomatoes"}, {"level": "EXTRA", "ingredient": "Shredded Salad"}, {"level": "EXTRA", "ingredient": "Cucumber"}, {"level": "EXTRA", "ingredient": "Caramelized Onion"}, {"level": "EXTRA", "ingredient": "Black Pepper"}, {"level": "EXTRA", "ingredient": "Chilli"}, {"level": "EXTRA", "ingredient": "Mayo"}]
51	43	11	1	0.00	[]
52	43	5	1	0.00	[]
53	44	15	1	6.00	[]
54	45	10	1	1.00	[]
55	46	8	1	6.50	[]
56	47	8	1	6.50	[]
57	48	4	1	5.50	[]
58	49	1	1	0.00	[]
59	49	6	1	6.50	[]
60	50	1	1	0.00	[]
61	50	8	1	6.50	[{"level": "LESS", "ingredient": "Tomatoes"}, {"level": "MEDIUM", "ingredient": "Shredded Salad"}, {"level": "MEDIUM", "ingredient": "Cucumber"}, {"level": "MEDIUM", "ingredient": "Caramelized Onion"}, {"level": "MEDIUM", "ingredient": "Black Pepper"}, {"level": "MEDIUM", "ingredient": "Chilli"}, {"level": "MEDIUM", "ingredient": "Mayo"}, {"level": "EXTRA", "ingredient": "Cheese"}]
62	50	7	2	5.50	[]
63	50	13	1	8.00	[]
64	50	5	1	5.50	[]
65	51	15	1	6.00	[]
66	52	8	1	6.50	[]
67	52	11	1	3.50	[]
68	53	12	1	7.00	[]
69	53	13	1	8.00	[]
70	54	8	1	6.50	[{"level": "EXTRA", "ingredient": "Beef Oblong Patty"}, {"level": "MEDIUM", "ingredient": "Mayonnaise"}, {"level": "MEDIUM", "ingredient": "Black Pepper Sauce"}, {"level": "MEDIUM", "ingredient": "Caramelised Onion"}, {"level": "MEDIUM", "ingredient": "Egg"}]
71	55	6	1	6.50	[]
72	56	4	1	5.50	[]
73	56	4	1	5.50	[{"level": "MEDIUM", "ingredient": "Mayonnaise"}, {"level": "MEDIUM", "ingredient": "Black Pepper Sauce"}, {"level": "MEDIUM", "ingredient": "Caramelised Onion"}, {"level": "EXTRA", "ingredient": "Lettuce"}, {"level": "EXTRA", "ingredient": "Egg"}]
74	57	15	1	6.00	[{"level": "nk maggi tpi xsei mee", "ingredient": "Remarks"}]
75	58	5	1	5.50	[]
76	59	8	1	6.50	[]
77	60	8	1	6.50	[]
78	61	8	1	6.50	[]
80	63	4	1	5.50	[{"level": "EXTRA", "ingredient": "Mayonnaise"}, {"level": "EXTRA", "ingredient": "Black Pepper Sauce"}, {"level": "EXTRA", "ingredient": "Caramelised Onion"}, {"level": "EXTRA", "ingredient": "Lettuce"}, {"level": "EXTRA", "ingredient": "Egg"}]
81	64	8	1	6.50	[{"level": "EXTRA", "ingredient": "Beef Oblong Patty"}, {"level": "MEDIUM", "ingredient": "Mayonnaise"}, {"level": "MEDIUM", "ingredient": "Black Pepper Sauce"}, {"level": "MEDIUM", "ingredient": "Caramelised Onion"}, {"level": "MEDIUM", "ingredient": "Egg"}]
82	65	1	1	4.00	[]
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.orders (id, order_number, user_id, guest_name, guest_phone, status, payment_method, payment_status, subtotal, tax, total, pickup_time, notes, created_at, payment_token, payment_channel) FROM stdin;
18	ORD407084	7	\N	\N	CANCELLED	ONLINE	UNPAID	9.80	0.59	10.39	2026-06-03 14:45:00	\N	2026-06-03 22:58:08.296269	\N	\N
23	ORD959485	1	Izzat Amri	0123456890	CANCELLED	CASH	UNPAID	6.50	0.39	6.89	\N	\N	2026-06-04 16:26:54.056173	\N	\N
25	ORD478359	7	\N	\N	CANCELLED	CASH	UNPAID	0.00	0.00	0.00	\N	\N	2026-06-04 22:31:08.916116	\N	\N
26	ORD455659	10	\N	\N	CANCELLED	CASH	UNPAID	11.40	0.68	12.08	\N	\N	2026-06-04 22:33:18.666636	\N	\N
27	ORD752194	2	\N	\N	CANCELLED	CASH	UNPAID	7.90	0.47	8.37	\N	\N	2026-06-04 22:33:59.102003	\N	\N
28	ORD114515	\N	\N	\N	CANCELLED	CASH	UNPAID	14.40	0.86	15.26	\N	\N	2026-06-05 03:04:54.267442	\N	\N
40	ORD954333	10	\N	\N	COMPLETED	ONLINE	PAID	7.90	0.47	8.37	\N	\N	2026-06-05 16:11:09.928088	token_9a0be235a19f49c8abb02f094a83b085	BOOST
42	ORD557956	11	\N	\N	COMPLETED	ONLINE	PAID	4.90	0.29	5.19	\N	\N	2026-06-05 17:39:23.479464	token_9c844753f2274a75ac0f7b854fb965ef	DUITNOW
49	ORD221905	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-07 16:08:42.647886	token_1884ab1a121a45c2a53a1c2e2e6aefd3	TNG
39	ORD220554	10	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 16:03:02.06239	token_df20db4c0bd5430a8b0bfc82b7d4983e	TNG
5	ORD131595	\N	Test Guest	0123456789	COMPLETED	CASH	PAID	4.90	0.29	5.19	\N	\N	2026-06-03 03:55:20.167035	\N	\N
8	ORD678677	\N	Afiq	0123456789	COMPLETED	CASH	PAID	5.50	0.33	5.83	2026-06-02 21:00:00	\N	2026-06-03 04:32:47.567172	\N	\N
6	ORD629132	\N	Test Guest	0123456789	COMPLETED	ONLINE	UNPAID	4.90	0.29	5.19	\N	\N	2026-06-03 03:55:22.097341	\N	\N
10	ORD778608	\N	izzat	01234567890	COMPLETED	CASH	PAID	4.90	0.29	5.19	\N	\N	2026-06-03 15:04:33.524741	\N	\N
4	ORD714750	\N	\N	\N	COMPLETED	CASH	PAID	4.90	0.29	5.19	2026-06-02 19:30:00	\N	2026-06-03 03:25:03.145303	\N	\N
7	ORD155955	\N	\N	\N	COMPLETED	CASH	PAID	4.90	0.29	5.19	2026-06-02 21:00:00	\N	2026-06-03 04:00:40.045446	\N	\N
9	ORD581466	\N	\N	\N	COMPLETED	CASH	PAID	4.90	0.29	5.19	\N	\N	2026-06-03 14:11:29.442546	\N	\N
11	ORD693715	\N	\N	\N	COMPLETED	CASH	PAID	10.40	0.62	11.02	\N	\N	2026-06-03 15:56:05.948979	\N	\N
50	ORD141169	14	\N	\N	COMPLETED	ONLINE	PAID	31.00	1.86	32.86	2026-06-08 17:45:00	\N	2026-06-09 01:33:34.056976	token_b7eb5b59796a4610b582d78a85999d15	TNG
41	ORD669489	11	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	bt keje elok2 la	2026-06-05 17:34:59.975067	token_bbd185284a7d4617b0283930faac3180	SHOPEEPAY
52	ORD455898	14	\N	\N	COMPLETED	ONLINE	PAID	10.00	0.60	10.60	\N	\N	2026-06-10 15:33:49.104319	token_47fad3dfc44a4c3089de9537a7eaabff	TNG
43	ORD612302	11	\N	\N	COMPLETED	ONLINE	PAID	0.00	0.00	0.00	\N	\N	2026-06-05 17:43:46.01183	token_06f9fad6d1dd438586973bb47e4073b7	DUITNOW
44	ORD977629	12	\N	\N	COMPLETED	ONLINE	PAID	6.00	0.36	6.36	\N	\N	2026-06-07 15:58:10.779081	token_1e9d1cb95bab4279846d739df1edbdbf	TNG
45	ORD504451	12	\N	\N	COMPLETED	ONLINE	PAID	1.00	0.06	1.06	\N	\N	2026-06-07 16:01:22.014673	token_4f22d9609f0c400e81e1fd79879c99a7	DUITNOW
47	ORD294953	2	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-07 16:04:16.951926	token_38002fba15ad408e8854784de299b7cc	DUITNOW
48	ORD751142	2	\N	\N	COMPLETED	CASH	PAID	5.50	0.33	5.83	\N	\N	2026-06-07 16:04:30.503363	\N	CASH
46	ORD875094	12	\N	\N	COMPLETED	CASH	PAID	6.50	0.39	6.89	\N	\N	2026-06-07 16:02:26.786357	\N	CASH
54	ORD309946	16	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-10 17:06:15.473747	token_050218e0641f41fc938b6908ee5d6a65	TNG
51	ORD490561	14	\N	\N	COMPLETED	ONLINE	PAID	6.00	0.36	6.36	\N	\N	2026-06-10 15:23:40.051899	token_531c630d1ffe47a0be0cf672753c52af	SHOPEEPAY
53	ORD139964	14	\N	\N	COMPLETED	CASH	PAID	15.00	0.90	15.90	\N	\N	2026-06-10 15:34:55.067219	\N	CASH
56	ORD514338	11	\N	\N	ACCEPTED	ONLINE	PAID	11.00	0.66	11.66	\N	\N	2026-06-11 00:29:49.563479	token_5d0804fb37b84a6c84be1c0003b9c37e	BOOST
57	ORD659841	18	\N	\N	ACCEPTED	ONLINE	PAID	6.00	0.36	6.36	\N	\N	2026-06-11 00:44:14.863157	token_6c49ec212c4f4bfc8d598c9cd23a131e	TNG
58	ORD111884	11	\N	\N	ACCEPTED	ONLINE	PAID	5.50	0.33	5.83	\N	\N	2026-06-11 00:47:11.771296	token_60166625b4b243ada1525ce53e5dd8ef	DUITNOW
14	ORD683123	7	\N	\N	COMPLETED	CASH	PAID	10.40	0.62	11.02	2026-06-03 09:00:00	\N	2026-06-03 16:59:41.039538	\N	\N
17	ORD673202	\N	Izzat Amri	0123456890	COMPLETED	CASH	PAID	5.50	0.33	5.83	\N	\N	2026-06-03 21:00:02.418169	\N	\N
19	ORD472761	7	\N	\N	COMPLETED	CASH	PAID	4.90	0.29	5.19	\N	\N	2026-06-04 13:05:08.036205	\N	\N
13	ORD785962	\N	\N	\N	COMPLETED	CASH	PAID	9.80	0.59	10.39	2026-06-03 09:00:00	\N	2026-06-03 16:38:33.360565	\N	\N
55	ORD417181	11	\N	\N	ACCEPTED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-10 19:31:47.553147	token_126468cba7464cb4be041db99147c321	TNG
59	ORD707039	21	\N	\N	PENDING	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-11 11:43:08.332203	token_1df329e2dbdb4a0a919301cdd2146dbe	DUITNOW
60	ORD222813	11	\N	\N	PENDING	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-11 12:21:29.456022	token_a6d7b39c9fde44da8b0264b499524575	DUITNOW
61	ORD529754	22	\N	\N	PENDING	ONLINE	UNPAID	6.50	0.39	6.89	\N	\N	2026-06-11 12:24:21.371523	token_233b185f30d340d584d6de89dc68e7b5	DUITNOW
37	ORD438215	7	\N	\N	COMPLETED	ONLINE	PAID	7.90	0.47	8.37	\N	\N	2026-06-05 13:33:15.526985	token_b318a820d2da447d91e9a9752a3cf42b	DUITNOW
12	ORD263396	7	\N	\N	COMPLETED	CASH	PAID	4.90	0.29	5.19	\N	\N	2026-06-03 16:21:13.090293	\N	\N
20	ORD896886	7	\N	\N	COMPLETED	CASH	PAID	13.00	0.78	13.78	\N	\N	2026-06-04 14:37:44.252018	\N	\N
21	ORD762135	\N	Awang	012345467890	COMPLETED	CASH	PAID	15.80	0.95	16.75	\N	\N	2026-06-04 14:39:51.260794	\N	\N
22	ORD377626	7	\N	\N	COMPLETED	CASH	PAID	20.90	1.25	22.15	\N	\N	2026-06-04 15:59:45.329505	\N	\N
24	ORD312519	7	\N	\N	COMPLETED	CASH	PAID	17.70	1.06	18.76	\N	\N	2026-06-04 17:35:40.915437	\N	\N
29	ORD626278	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 03:36:11.805141	\N	\N
30	ORD947200	7	\N	\N	COMPLETED	ONLINE	PAID	8.90	0.53	9.43	\N	\N	2026-06-05 03:36:31.181178	\N	\N
31	ORD192692	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 03:39:38.10869	token_6ceb5b1a278e4b258f407b08c9535ceb	DUITNOW
32	ORD387094	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 03:45:32.941935	token_21d979939dda4ca09102585a2b374d71	TNG
33	ORD107805	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 13:29:36.070246	token_88e0f21741b0462fba3a072b9d40fb7e	TNG
34	ORD355759	7	\N	\N	COMPLETED	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-05 13:29:46.59215	token_6893b48cee764cb4ad641dc7f19302bf	TNG
35	ORD137217	7	\N	\N	COMPLETED	ONLINE	PAID	7.90	0.47	8.37	\N	\N	2026-06-05 13:30:01.429806	token_99e2fe85ce76455889e7d1b48a687ab0	SHOPEEPAY
36	ORD561113	7	\N	\N	COMPLETED	ONLINE	PAID	7.90	0.47	8.37	\N	\N	2026-06-05 13:32:48.703186	token_ae4b32a72c594fcdbe22d92d7f34eb2d	DUITNOW
38	ORD485992	7	\N	\N	COMPLETED	ONLINE	PAID	7.90	0.47	8.37	\N	\N	2026-06-05 14:13:04.489943	token_d6bd015ebed44da0a0eb90a5209a7226	DUITNOW
62	ORD884482	11	\N	\N	PENDING	ONLINE	PAID	5.50	0.33	5.83	\N	\N	2026-06-11 12:29:07.680057	token_4c9e17fb8be54a369ab77270b54273d5	DUITNOW
63	ORD141485	11	\N	\N	PENDING	ONLINE	PAID	5.50	0.33	5.83	\N	\N	2026-06-11 12:33:58.824302	token_7f00de1b8da44102a46cad2a0dd81a44	DUITNOW
64	ORD400020	11	\N	\N	PENDING	ONLINE	PAID	6.50	0.39	6.89	\N	\N	2026-06-11 13:20:36.844909	token_18af5ef36f534204901dbb021c83c8d0	DUITNOW
65	ORD843773	11	\N	\N	PENDING	ONLINE	PAID	4.00	0.24	4.24	\N	\N	2026-06-11 13:25:46.77597	token_b052e74450c0423dbb3e12b320a86d2b	DUITNOW
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.payments (id, order_id, transaction_ref, method, amount, status, receipt_url, paid_at, created_at) FROM stdin;
2	14	\N	CASH	11.02	SUCCESS	\N	2026-06-03 17:01:13.21207	2026-06-03 17:01:13.212069
4	17	\N	CASH	5.83	SUCCESS	\N	2026-06-04 02:12:22.954872	2026-06-04 02:12:22.962724
5	19	\N	CASH	5.19	SUCCESS	\N	2026-06-04 14:34:45.97283	2026-06-04 14:34:45.977692
6	22	\N	CASH	22.15	SUCCESS	\N	2026-06-04 16:01:04.277427	2026-06-04 16:01:03.252668
7	20	\N	CASH	13.78	SUCCESS	\N	2026-06-04 16:08:59.888784	2026-06-04 16:08:59.888783
8	21	\N	CASH	16.75	SUCCESS	\N	2026-06-04 16:09:00.792771	2026-06-04 16:09:00.792771
3	13	\N	CASH	10.39	SUCCESS	\N	2026-06-04 16:09:31.849112	2026-06-03 17:01:14.164263
9	23	\N	CASH	6.89	SUCCESS	\N	2026-06-04 17:32:21.342952	2026-06-04 17:32:21.344467
10	24	\N	CASH	18.76	SUCCESS	\N	2026-06-04 17:35:53.156913	2026-06-04 17:35:52.309164
1	12	\N	CASH	5.19	SUCCESS	\N	2026-06-04 22:56:26.873479	2026-06-03 17:01:10.693527
11	31	TXN-1780601997092	FPX	6.89	SUCCESS	\N	2026-06-05 03:39:57.091639	2026-06-05 03:39:57.094196
12	32	TXN-1780602358130	FPX	6.89	SUCCESS	\N	2026-06-05 03:45:58.13094	2026-06-05 03:45:58.13358
13	38	TXN-1780640014413	FPX	8.37	SUCCESS	\N	2026-06-05 14:13:34.413174	2026-06-05 14:13:34.413699
14	39	TXN-1780646591185	FPX	6.89	SUCCESS	\N	2026-06-05 16:03:11.185585	2026-06-05 16:03:11.186676
15	40	TXN-1780647078609	FPX	8.37	SUCCESS	\N	2026-06-05 16:11:18.609713	2026-06-05 16:11:18.610243
16	41	TXN-1780652117145	FPX	6.89	SUCCESS	\N	2026-06-05 17:35:17.145088	2026-06-05 17:35:17.147986
17	42	TXN-1780652371892	FPX	5.19	SUCCESS	\N	2026-06-05 17:39:31.892795	2026-06-05 17:39:31.893801
18	43	TXN-1780652646142	FPX	0.00	SUCCESS	\N	2026-06-05 17:44:06.142784	2026-06-05 17:43:57.037992
19	44	TXN-1780819100040	FPX	6.36	SUCCESS	\N	2026-06-07 15:58:20.040266	2026-06-07 15:58:20.042266
20	45	TXN-1780819289206	FPX	1.06	SUCCESS	\N	2026-06-07 16:01:29.206838	2026-06-07 16:01:29.210835
21	49	TXN-1780819732017	FPX	6.89	SUCCESS	\N	2026-06-07 16:08:52.01772	2026-06-07 16:08:52.019132
22	48	\N	CASH	5.83	SUCCESS	\N	2026-06-07 16:09:22.609969	2026-06-07 16:09:22.609969
23	50	TXN-1780940035234	FPX	32.86	SUCCESS	\N	2026-06-09 01:33:55.234137	2026-06-09 01:33:55.26074
24	51	TXN-1781076236124	FPX	6.36	SUCCESS	\N	2026-06-10 15:23:56.123564	2026-06-10 15:23:56.127562
25	52	TXN-1781076842871	FPX	10.60	SUCCESS	\N	2026-06-10 15:34:02.871624	2026-06-10 15:34:02.876972
26	54	TXN-1781082394330	FPX	6.89	SUCCESS	\N	2026-06-10 17:06:34.330671	2026-06-10 17:06:34.331686
27	46	\N	CASH	6.89	SUCCESS	\N	2026-06-10 19:30:06.354602	2026-06-10 19:30:06.369611
28	53	\N	CASH	15.90	SUCCESS	\N	2026-06-10 19:30:14.932818	2026-06-10 19:30:14.933819
29	55	TXN-1781091121163	FPX	6.89	SUCCESS	\N	2026-06-10 19:32:01.163011	2026-06-10 19:32:01.166023
30	56	TXN-1781109002270	FPX	11.66	SUCCESS	\N	2026-06-11 00:30:02.270953	2026-06-11 00:30:02.272986
31	57	TXN-1781109873522	FPX	6.36	SUCCESS	\N	2026-06-11 00:44:33.522052	2026-06-11 00:44:33.522052
32	58	TXN-1781110044129	FPX	5.83	SUCCESS	\N	2026-06-11 00:47:24.129776	2026-06-11 00:47:24.130882
33	59	TXN-1781149400783	FPX	6.89	SUCCESS	\N	2026-06-11 11:43:20.783318	2026-06-11 11:43:20.78626
34	60	TXN-1781151696739	FPX	6.89	SUCCESS	\N	2026-06-11 12:21:36.739301	2026-06-11 12:21:36.743843
35	62	TXN-1781152153966	FPX	5.83	SUCCESS	\N	2026-06-11 12:29:13.966971	2026-06-11 12:29:13.96797
36	63	TXN-1781152516720	FPX	5.83	SUCCESS	\N	2026-06-11 12:35:16.720342	2026-06-11 12:35:16.720342
37	64	TXN-1781155249897	FPX	6.89	SUCCESS	\N	2026-06-11 13:20:49.897259	2026-06-11 13:20:49.899099
38	65	TXN-1781155556308	FPX	4.24	SUCCESS	\N	2026-06-11 13:25:56.308548	2026-06-11 13:25:56.314672
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.promotions (id, title, description, discount_type, discount_value, is_active, start_date, end_date) FROM stdin;
1	Combo Special — 2 Burger Ramly + 1 Drink RM12.90	Dapatkan 2 Burger Ramly Ayam Biasa dan 1 Milo Ais pada harga istimewa RM12.90 sahaja!	FIXED	0.90	t	2026-06-03	2026-07-03
2	Double Patty Friday	Every Friday — upgrade to Double Patty for only RM1 extra!	FIXED	1.00	t	2026-06-03	2026-09-01
\.


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.security_logs (id, user_id, user_email, user_role, action, details, previous_value, new_value, ip_address, created_at) FROM stdin;
1	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD557956 (ID: 42).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-05 17:40:13.939484
2	8	admin@bkb.com	ADMIN	Role Assignment	Assigned new role MANAGER to user azmin.cokcak@gmail.com.	CUSTOMER	MANAGER	0:0:0:0:0:0:0:1	2026-06-05 17:45:08.379445
3	8	admin@bkb.com	ADMIN	User Update	Updated user details for azmin.cokcak@gmail.com (ID: 11): Role: CUSTOMER -> MANAGER; 	\N	\N	0:0:0:0:0:0:0:1	2026-06-05 17:45:08.390292
4	8	admin@bkb.com	ADMIN	Role Assignment	Assigned new role CUSTOMER to user azmin.cokcak@gmail.com.	MANAGER	CUSTOMER	0:0:0:0:0:0:0:1	2026-06-05 17:45:53.336334
5	8	admin@bkb.com	ADMIN	User Update	Updated user details for azmin.cokcak@gmail.com (ID: 11): Role: MANAGER -> CUSTOMER; 	\N	\N	0:0:0:0:0:0:0:1	2026-06-05 17:45:53.344054
6	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD220554 (ID: 39).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-07 16:05:53.602377
7	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD954333 (ID: 40).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-07 16:05:55.073887
8	2	staff@bkb.com	STAFF	Payment Status Override	Overrode cash payment status to PAID for order ID 48.	UNPAID	PAID	0:0:0:0:0:0:0:1	2026-06-07 16:09:22.626263
9	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD221905 (ID: 49).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-07 16:10:51.638389
10	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD141169 (ID: 50).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-09 01:35:57.355913
11	1	manager@bkb.com	MANAGER	Store Operations Toggle	Toggled store operations from OPEN to CLOSED.	true	false	0:0:0:0:0:0:0:1	2026-06-09 14:09:11.588317
12	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD455898 (ID: 52).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 15:39:46.361262
13	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD669489 (ID: 41).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:29:55.446527
14	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD612302 (ID: 43).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:29:56.217387
15	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD977629 (ID: 44).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:29:57.070151
16	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD504451 (ID: 45).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:29:58.750396
17	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD294953 (ID: 47).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:00.04367
18	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD751142 (ID: 48).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:01.067597
19	2	staff@bkb.com	STAFF	Payment Status Override	Overrode cash payment status to PAID for order ID 46.	UNPAID	PAID	0:0:0:0:0:0:0:1	2026-06-10 19:30:06.385885
20	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD875094 (ID: 46).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:07.452321
21	2	staff@bkb.com	STAFF	Payment Status Override	Overrode cash payment status to PAID for order ID 53.	UNPAID	PAID	0:0:0:0:0:0:0:1	2026-06-10 19:30:14.948321
22	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD490561 (ID: 51).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:19.919103
23	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD139964 (ID: 53).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:21.165937
24	2	staff@bkb.com	STAFF	Manual Order Completion	Manually completed order ORD309946 (ID: 54).	READY	COMPLETED	0:0:0:0:0:0:0:1	2026-06-10 19:30:22.465598
25	1	manager@bkb.com	MANAGER	Store Operations Toggle	Toggled store operations from OPEN to CLOSED.	true	false	0:0:0:0:0:0:0:1	2026-06-11 00:49:40.161149
\.


--
-- Data for Name: staff_documents; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.staff_documents (id, user_id, ic_number, typhoid_expiry, food_handler_expiry, emergency_contact_name, emergency_contact_phone, notes, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bkb_user
--

COPY public.users (id, name, email, phone, password_hash, role, is_active, created_at) FROM stdin;
7	Izzat Amri	izzat@gmail.com	0123456890	$2a$12$g/0prY6CoEbWb41qNwV.nex4OzUUnhIAhBgm0yi.MH.f1a/Uzg8Ui	CUSTOMER	t	2026-06-03 16:15:56.740709
8	System Admin	admin@bkb.com	0111111111	$2a$12$Yv.rGj1kPS0cbjooq1/E8.89h/ImE69jJ6EhdHEUb27UON3poYqXO	ADMIN	t	2026-06-04 12:45:14.384028
1	BKB Manager	manager@bkb.com	0123456789	$2a$12$WzOvkjz2Bb2bM9CY23975epyEBHIbpJy8tmCR0MvVfxhbPdXFXFRu	MANAGER	t	2026-06-03 03:02:12.74455
2	BKB Staff	staff@bkb.com	0129876543	$2a$12$32jcM/iLQDADgTVanAM0/ud74czi/jHsVtEV4aDdzFCqPipozcG0a	STAFF	t	2026-06-03 03:02:12.74455
9	Awang	guest_1780555181275@bkb.guest	012345467890	$2a$12$rp3p3irvF0f/fPj0daon4uSRRXhdzpq/cgsqeyYh4pkchYKC6rPyq	GUEST	t	2026-06-04 14:39:41.573022
10	Syauqi	syauqi@gmail.com	01123456789	$2a$12$skeVdQnQ5Qjja9lh3oOl6.7VkwrcE6Q3HUZJhKpXMzb49J6QPKwtm	CUSTOMER	t	2026-06-04 22:32:25.119586
11	Azmin Kacak 1	azmin.cokcak@gmail.com	01139018099	$2a$12$lK5KMqNbLEmsvQVq/Up3nuC2f4WzLYrZOqQSkeoZcX80w4LOjbt6C	CUSTOMER	t	2026-06-05 17:32:40.504367
12	Iqmal Hadi	iqmalhadi@gmail.com	01234567890	$2a$12$NnHaZvONO0qDF9QOn4EuoefLleSCLgYnPw/R7a9eyy4sNDMdzvtC.	CUSTOMER	t	2026-06-07 14:18:38.819754
13	afiq	afiq@gmail.com	0123456789	$2a$12$H6fhy2Opa0M0iU0cdlb4c.s7iD9fkf19plhCTnPX3QYyzGzvHWRIe	CUSTOMER	t	2026-06-07 16:07:13.4034
14	hazri	hazzriey64halimiey@gmail.com	0104197947	$2a$12$wOV2d0vlSIqVHUM3S/fmTOXskuLOQAn3W3chSqZ0PL7UHaYDCkXxG	CUSTOMER	t	2026-06-09 01:32:04.752327
15	ammar	ammar@gmail.com	0178167499	$2a$12$cTJoRsneTwWYqut.Yecsl.bD9u1iFv2MmHYwss5GjtRQCOQ3Nr3nW	CUSTOMER	t	2026-06-10 15:43:03.168225
16	Muhammad Shahrul Aiman Bin Mokhtar	aimanmokhtar296@gmail.com	01172735439	$2a$12$jyYc0FpKafliSleeYDs3z.JsE1PJrRBwFOlfOk73vMBe5sHl81oRK	CUSTOMER	t	2026-06-10 17:05:14.291739
17	Test Real Email	testrealemail@gmail.com	0123456789	$2a$12$nkuBtXpDqMiq5fMSXColIO.XL.9uDCIFCJkwCaz17cA/nwMBDWzwq	CUSTOMER	t	2026-06-10 22:37:22.082401
18	abu bin ali	abuali@gmail.com	\N	$2a$12$msSFf477glpKjc4wv82SSOAmn/.6C/dGk08X9dmIOk8SknZ7Ib7e6	CUSTOMER	t	2026-06-11 00:42:42.368108
19	Test User	testuser@example.com	0123456789	$2a$12$RiAEgiR.DsmhlR4bJe52g.4LD5B4e0d8ih/FkE4fFOXjto31LzyL.	CUSTOMER	t	2026-06-11 11:03:16.674214
20	Guest User	guest_1781148147768@bkb.guest	0123456789	$2a$12$OiQvpFOj6X.It6Leejo.zOhvS1BD5be/YRgqsDEbl3kH28LaFPp86	GUEST	t	2026-06-11 11:22:28.156845
21	Test User	test_user_unique@example.com	\N	$2a$12$csjm2.pXWNwB6NSxKZHNOO4asRQyHuH8mtrMQjJZYyDziV6/WT9W6	CUSTOMER	t	2026-06-11 11:42:24.422353
22	Tester	tester@example.com	\N	$2a$12$wwh4BJAwkfkV7Frchvq2ge9kSbwchTdvlmtF.uNbf9UJb3rYXNlLW	CUSTOMER	t	2026-06-11 12:23:18.542765
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- Name: invalidated_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.invalidated_tokens_id_seq', 112, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.inventory_id_seq', 16, true);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 144, true);


--
-- Name: loyalty_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.loyalty_accounts_id_seq', 15, true);


--
-- Name: loyalty_rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.loyalty_rewards_id_seq', 4, true);


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.loyalty_transactions_id_seq', 33, true);


--
-- Name: menu_item_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.menu_item_ingredients_id_seq', 71, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 15, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.order_items_id_seq', 82, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.orders_id_seq', 65, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.payments_id_seq', 38, true);


--
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.promotions_id_seq', 2, true);


--
-- Name: security_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.security_logs_id_seq', 25, true);


--
-- Name: staff_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.staff_documents_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bkb_user
--

SELECT pg_catalog.setval('public.users_id_seq', 22, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: ingredient_outages ingredient_outages_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.ingredient_outages
    ADD CONSTRAINT ingredient_outages_pkey PRIMARY KEY (name);


--
-- Name: invalidated_tokens invalidated_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.invalidated_tokens
    ADD CONSTRAINT invalidated_tokens_pkey PRIMARY KEY (id);


--
-- Name: invalidated_tokens invalidated_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.invalidated_tokens
    ADD CONSTRAINT invalidated_tokens_token_key UNIQUE (token);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_accounts loyalty_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);


--
-- Name: loyalty_accounts loyalty_accounts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_user_id_key UNIQUE (user_id);


--
-- Name: loyalty_rewards loyalty_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: menu_item_ingredients menu_item_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_ingredients
    ADD CONSTRAINT menu_item_ingredients_pkey PRIMARY KEY (id);


--
-- Name: menu_item_inventory menu_item_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_inventory
    ADD CONSTRAINT menu_item_inventory_pkey PRIMARY KEY (menu_item_id, inventory_id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_transaction_ref_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_transaction_ref_key UNIQUE (transaction_ref);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: staff_documents staff_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.staff_documents
    ADD CONSTRAINT staff_documents_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_inv_tx_created_at; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_inv_tx_created_at ON public.inventory_transactions USING btree (created_at);


--
-- Name: idx_inv_tx_inventory_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_inv_tx_inventory_id ON public.inventory_transactions USING btree (inventory_id);


--
-- Name: idx_inv_tx_order_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_inv_tx_order_id ON public.inventory_transactions USING btree (order_id);


--
-- Name: idx_invalidated_tokens_token; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_invalidated_tokens_token ON public.invalidated_tokens USING btree (token);


--
-- Name: idx_inventory_category; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_inventory_category ON public.inventory USING btree (category);


--
-- Name: idx_inventory_status; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_inventory_status ON public.inventory USING btree (status);


--
-- Name: idx_loyalty_tx_account_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_loyalty_tx_account_id ON public.loyalty_transactions USING btree (account_id);


--
-- Name: idx_loyalty_tx_order_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_loyalty_tx_order_id ON public.loyalty_transactions USING btree (order_id);


--
-- Name: idx_menu_items_available; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_menu_items_available ON public.menu_items USING btree (is_available);


--
-- Name: idx_menu_items_category; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_menu_items_category ON public.menu_items USING btree (category);


--
-- Name: idx_mii_menu_item; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_mii_menu_item ON public.menu_item_ingredients USING btree (menu_item_id);


--
-- Name: idx_order_items_menu_item_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_order_items_menu_item_id ON public.order_items USING btree (menu_item_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_payments_order_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_promotions_active; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_promotions_active ON public.promotions USING btree (is_active);


--
-- Name: idx_security_logs_action; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_security_logs_action ON public.security_logs USING btree (action);


--
-- Name: idx_security_logs_created_at; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_security_logs_created_at ON public.security_logs USING btree (created_at);


--
-- Name: idx_security_logs_user_id; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_security_logs_user_id ON public.security_logs USING btree (user_id);


--
-- Name: idx_staff_docs_user; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE UNIQUE INDEX idx_staff_docs_user ON public.staff_documents USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: bkb_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: inventory trg_inventory_status; Type: TRIGGER; Schema: public; Owner: bkb_user
--

CREATE TRIGGER trg_inventory_status BEFORE INSERT OR UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_inventory_status();


--
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_transactions inventory_transactions_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;


--
-- Name: inventory_transactions inventory_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: loyalty_accounts loyalty_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: loyalty_rewards loyalty_rewards_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: loyalty_transactions loyalty_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: menu_item_ingredients menu_item_ingredients_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_ingredients
    ADD CONSTRAINT menu_item_ingredients_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: menu_item_inventory menu_item_inventory_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_inventory
    ADD CONSTRAINT menu_item_inventory_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;


--
-- Name: menu_item_inventory menu_item_inventory_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.menu_item_inventory
    ADD CONSTRAINT menu_item_inventory_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: security_logs security_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: staff_documents staff_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bkb_user
--

ALTER TABLE ONLY public.staff_documents
    ADD CONSTRAINT staff_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 8oJs3jfzBTrvfmtZCRP5kWeJuXajYaJduGd4I6NMdtYN12cQa16zBSoH0Uzi9rd

