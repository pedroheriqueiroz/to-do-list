CREATE TABLE public.users (
	id bigserial NOT NULL,
	username varchar NOT NULL,
	name varchar NULL,
	"password" varchar NULL,
	email varchar NOT NULL,
	created_at timestamp without time zone NULL,
	updated_at timestamp without time zone NULL,
	CONSTRAINT users_pk PRIMARY KEY (id),
	CONSTRAINT user_uq UNIQUE (username),
	CONSTRAINT email_uq UNIQUE (email)
);