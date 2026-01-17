# Active Projects

## OJS Migration - Pak Habiddin (sciencesustain.com)
**Status**: ✅ COMPLETED - Production Live
**Started**: [2026-01-18]  
**Completed**: [2026-01-18]  
**Client**: Pak Habiddin (Rp 3.5M/year maintenance)
**Domain**: sciencesustain.com

### Servers
**Old (Biznet Gio)**: 103.103.22.77, 2GB RAM, Jakarta - **Ready to decommission**
**New (Hostbrr)**: 5.231.28.82 / server-1, 4GB RAM, Netherlands
- SSH: Port 224 (key-only), Tailscale VPN enabled
- Stack: Nginx 1.24, PHP 8.3.6, MySQL 8.0.44
- Performance: 256x IOPS, response time 652ms (was 10s)
- Cost: Rp 632k/year (56% savings)

### Key Implementations
**Performance**: 15x faster via smart conditional DNS lookup in PKPRequest.php
**Security**: Rating 9.5/10 - SSH hardened, UFW, Fail2ban, ModSecurity WAF (914 OWASP rules)
**Backup**: Daily 2 AM via Tailscale to `/mnt/d/backups/`
- Database: Full (~330KB)
- Config: Full (~8KB)  
- Uploads: Incremental (~592MB first, then changes only)
- Custom code: SHA256 change detection (PKPRequest.php, config.inc.php)
- Scripts: `/root/backup-ojs.sh`, `~/scripts/pull-ojs-backup.sh`, `~/scripts/restore-ojs-backup.sh`

### Quick Access
- Server: `ssh -p 224 root@server-1`
- OJS: `/var/www/sciencesustain.com`
- Uploads: `/var/www/sciencesustain-files`
- Logs: `~/scripts/backup.log`

**Documentation**: 
- `_personal/projects/2026-01-18-migrasi-ojs/OJS_MIGRATION_ANALYSIS.md`
- `_personal/projects/2026-01-18-migrasi-ojs/OJS_INSTALLATION_ANALYSIS.md`
- `/root/OJS_DNS_OPTIMIZATION.md` (on server)
- `/root/SECURITY_REPORT.md` (on server)
- `~/scripts/BACKUP_README.md` (local)
