-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 09, 2026 at 05:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

START TRANSACTION;



--
-- Database: aws
--

-- --------------------------------------------------------

--
-- Table structure for table aws_batu
--

CREATE TABLE aws_batu (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site varchar(25) DEFAULT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_bondowoso
--

CREATE TABLE aws_bondowoso (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_bromo
--

CREATE TABLE aws_bromo (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_kandat
--

CREATE TABLE aws_kandat (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_kanigoro
--

CREATE TABLE aws_kanigoro (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_karangan
--

CREATE TABLE aws_karangan (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_kediri
--

CREATE TABLE aws_kediri (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_lamongan
--

CREATE TABLE aws_lamongan (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_mayang
--

CREATE TABLE aws_mayang (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_panarukan
--

CREATE TABLE aws_panarukan (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_paron
--

CREATE TABLE aws_paron (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_sampang
--

CREATE TABLE aws_sampang (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_situbondo
--

CREATE TABLE aws_situbondo (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_smpk_jombang
--

CREATE TABLE aws_smpk_jombang (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_smpk_mojokerto
--

CREATE TABLE aws_smpk_mojokerto (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_smpk_nganjuk
--

CREATE TABLE aws_smpk_nganjuk (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_smpk_sebayi
--

CREATE TABLE aws_smpk_sebayi (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_stageof_karangkates
--

CREATE TABLE aws_stageof_karangkates (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_stageof_pasuruan
--

CREATE TABLE aws_stageof_pasuruan (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_stageof_sawahan
--

CREATE TABLE aws_stageof_sawahan (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_tanggul
--

CREATE TABLE aws_tanggul (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_tiris
--

CREATE TABLE aws_tiris (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------

--
-- Table structure for table aws_unida_gontor
--

CREATE TABLE aws_unida_gontor (
  rec SERIAL PRIMARY KEY,
  model text NOT NULL,
  sn text NOT NULL,
  os text NOT NULL,
  site text NOT NULL,
  id_sta text NOT NULL,
  date varchar(25) NOT NULL,
  time varchar(25) NOT NULL,
  ws float NOT NULL,
  ws_max float NOT NULL,
  wd float NOT NULL,
  temp float NOT NULL,
  temp_max float NOT NULL,
  temp_min float NOT NULL,
  rh float NOT NULL,
  press float NOT NULL,
  rr float NOT NULL,
  sr float NOT NULL,
  sr_max float NOT NULL,
  log_temp float NOT NULL,
  batt float NOT NULL,
  lith float NOT NULL,
  timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table aws_batu
--

--
-- Indexes for table aws_bondowoso
--

--
-- Indexes for table aws_bromo
--

--
-- Indexes for table aws_kandat
--

--
-- Indexes for table aws_kanigoro
--

--
-- Indexes for table aws_karangan
--

--
-- Indexes for table aws_kediri
--

--
-- Indexes for table aws_lamongan
--

--
-- Indexes for table aws_mayang
--

--
-- Indexes for table aws_panarukan
--

--
-- Indexes for table aws_paron
--

--
-- Indexes for table aws_sampang
--

--
-- Indexes for table aws_situbondo
--

--
-- Indexes for table aws_smpk_jombang
--

--
-- Indexes for table aws_smpk_mojokerto
--

--
-- Indexes for table aws_smpk_nganjuk
--

--
-- Indexes for table aws_smpk_sebayi
--

--
-- Indexes for table aws_stageof_karangkates
--

--
-- Indexes for table aws_stageof_pasuruan
--

--
-- Indexes for table aws_stageof_sawahan
--

--
-- Indexes for table aws_tanggul
--

--
-- Indexes for table aws_tiris
--

--
-- Indexes for table aws_unida_gontor
--

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table aws_batu
--

--
-- AUTO_INCREMENT for table aws_bondowoso
--

--
-- AUTO_INCREMENT for table aws_bromo
--

--
-- AUTO_INCREMENT for table aws_kandat
--

--
-- AUTO_INCREMENT for table aws_kanigoro
--

--
-- AUTO_INCREMENT for table aws_karangan
--

--
-- AUTO_INCREMENT for table aws_kediri
--

--
-- AUTO_INCREMENT for table aws_lamongan
--

--
-- AUTO_INCREMENT for table aws_mayang
--

--
-- AUTO_INCREMENT for table aws_panarukan
--

--
-- AUTO_INCREMENT for table aws_paron
--

--
-- AUTO_INCREMENT for table aws_sampang
--

--
-- AUTO_INCREMENT for table aws_situbondo
--

--
-- AUTO_INCREMENT for table aws_smpk_jombang
--

--
-- AUTO_INCREMENT for table aws_smpk_mojokerto
--

--
-- AUTO_INCREMENT for table aws_smpk_nganjuk
--

--
-- AUTO_INCREMENT for table aws_smpk_sebayi
--

--
-- AUTO_INCREMENT for table aws_stageof_karangkates
--

--
-- AUTO_INCREMENT for table aws_stageof_pasuruan
--

--
-- AUTO_INCREMENT for table aws_stageof_sawahan
--

--
-- AUTO_INCREMENT for table aws_tanggul
--

--
-- AUTO_INCREMENT for table aws_tiris
--

--
-- AUTO_INCREMENT for table aws_unida_gontor
--
COMMIT;

