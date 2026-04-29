#!/bin/bash
# Convert SQLite syntax to PostgreSQL in agent files
# Usage: ./fix_postgres.sh <file>

file="$1"

# strftime patterns
sed -i "s/strftime('%Y-%m', fecha)/TO_CHAR(fecha, 'YYYY-MM')/g" "$file"
sed -i "s/strftime('%Y', fecha)/TO_CHAR(fecha, 'YYYY')/g" "$file"
sed -i "s/strftime('%m', fecha)/TO_CHAR(fecha, 'MM')/g" "$file"
sed -i "s/strftime('%d', fecha)/TO_CHAR(fecha, 'DD')/g" "$file"
sed -i "s/strftime('%w', fecha)/EXTRACT(DOW FROM fecha)/g" "$file"
sed -i "s/strftime('%Y-%m-%d', fecha)/TO_CHAR(fecha, 'YYYY-MM-DD')/g" "$file"
sed -i "s/strftime('%Y-%m', t.fecha)/TO_CHAR(t.fecha, 'YYYY-MM')/g" "$file"

# date('now') variants
sed -i "s/date('now')/CURRENT_DATE/g" "$file"
sed -i "s/date('now', '-1 day')/CURRENT_DATE - INTERVAL '1 day'/g" "$file"
sed -i "s/date('now', '-7 days')/CURRENT_DATE - INTERVAL '7 days'/g" "$file"
sed -i "s/date('now', '-30 days')/CURRENT_DATE - INTERVAL '30 days'/g" "$file"
sed -i "s/date('now', '-6 months')/CURRENT_DATE - INTERVAL '6 months'/g" "$file"
sed -i "s/date('now', '-3 months')/CURRENT_DATE - INTERVAL '3 months'/g" "$file"
sed -i "s/date('now', '-2 months')/CURRENT_DATE - INTERVAL '2 months'/g" "$file"
sed -i "s/date('now', '+7 days')/CURRENT_DATE + INTERVAL '7 days'/g" "$file"
sed -i "s/date('now', '+30 days')/CURRENT_DATE + INTERVAL '30 days'/g" "$file"
sed -i "s/date('now', 'start of month')/DATE_TRUNC('month', CURRENT_DATE)/g" "$file"
sed -i "s/date('now', 'start of year')/DATE_TRUNC('year', CURRENT_DATE)/g" "$file"

# datetime('now') variants
sed -i "s/datetime('now')/NOW()/g" "$file"
sed -i "s/datetime('now', '-1 day')/NOW() - INTERVAL '1 day'/g" "$file"
sed -i "s/datetime('now', '-7 days')/NOW() - INTERVAL '7 days'/g" "$file"

# julianday variants
sed -i "s/julianday(?) - julianday(fecha_vencimiento)/(?::date - fecha_vencimiento::date)/g" "$file"
sed -i "s/julianday('now') - julianday(fecha_vencimiento)/(CURRENT_DATE - fecha_vencimiento::date)/g" "$file"
sed -i "s/julianday(fecha_vencimiento) - julianday('now')/(fecha_vencimiento::date - CURRENT_DATE)/g" "$file"
sed -i "s/julianday(fecha) - julianday('now')/(fecha::date - CURRENT_DATE)/g" "$file"

# MAX(0, ...) in UPDATE context
sed -i "s/MAX(0, /GREATEST(0, /g" "$file"

# IFNULL
sed -i "s/IFNULL(/COALESCE(/g" "$file"

echo "Done: $file"
