create database mydb01;
\connect mydb01;
create schema schema01;
create table schema01.products (
    id bigserial not null primary key,
    description varchar(255) not null,
    code varchar(128)
);