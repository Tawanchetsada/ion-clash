# ที่มาของไฟล์เสียง

ไฟล์ .wav ในโฟลเดอร์นี้ลดขนาดจากต้นฉบับของ Kenney (CC0 — ไม่ต้องให้เครดิต แต่บันทึกไว้
เพื่อให้ตามรอยได้สำหรับเล่มวิทยานิพนธ์ ตาม D-17 ใน development-plan/00-decisions.md)

| ไฟล์ | ต้นฉบับ | ที่มา |
|---|---|---|
| place.wav | drop_002.wav | Kenney Interface Sounds (ผ่าน Calinou/kenney-interface-sounds, .wav) |
| correct.wav | confirmation_001.wav | Kenney Interface Sounds |
| wrong.wav | error_002.wav | Kenney Interface Sounds |
| gold.wav | confirmation_003.wav | Kenney Interface Sounds |
| levelup.wav | confirmation_004.wav | Kenney Interface Sounds |

ต้นฉบับที่ kenney.nl แจกเป็น .ogg ล้วน ซึ่ง Safari บน iPad เล่นไม่ได้ — ใช้ไฟล์ .wav
ที่แปลงไว้แล้วแบบไม่สูญเสียคุณภาพจาก https://github.com/Calinou/kenney-interface-sounds
และ https://github.com/Calinou/kenney-ui-audio แทน แล้วลดขนาดต่อด้วย
`scripts/prepare-audio.ts` (mono, ลด sample rate ครึ่งหนึ่ง, ตัดความเงียบหัวท้าย)

สัญญาอนุญาตต้นฉบับ: CC0 1.0 Universal — https://kenney.nl/assets/interface-sounds และ
https://kenney.nl/assets/ui-audio
