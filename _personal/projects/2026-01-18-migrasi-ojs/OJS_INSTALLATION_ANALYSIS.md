# OJS Installation Analysis
**Site:** sciencesustain.com  
**Date:** 2026-01-18  
**Current Server:** 103.103.22.77 (Biznet Gio)

---

## OJS Installation Details

### Version Information
- **OJS Version:** 3.4.0.3 (Released: 2023-08-28)
- **Application:** OJS2
- **Official URL:** https://pkp.sfu.ca/ojs/
- **Base URL:** https://sciencesustain.com

### Software Stack
- **Web Server:** Nginx 1.27.1
- **PHP:** 8.3.15 (CLI, NTS)
- **MySQL:** 8.0.44 (Ubuntu)
- **Database Driver:** mysqli

### PHP Modules Installed
✓ curl  
✓ libxml  
✓ mbstring  
✓ mysqli  
✓ mysqlnd  
✓ pdo_mysql  
✓ xml  
✓ xmlreader  
✓ xmlwriter  
✓ zip  

---

## Storage Analysis

### Installation Breakdown
| Component | Size | Location |
|-----------|------|----------|
| **OJS Core** | 347 MB | `/home/sianida26/sites/sciencesustain.com` |
| **Files Directory** | 763 MB | `/home/sianida26/sites/sciencesustain-files` |
| **Database** | 10.81 MB | `sciencesustain` (MySQL) |
| **Total** | **~1.12 GB** | - |

### File Statistics
- **Uploaded Files:** 5,639 files
- **Database Tables:** 124 tables

---

## Database Configuration

- **Host:** localhost
- **Database Name:** sciencesustain
- **Username:** sciencesustain
- **Size:** 10.81 MB
- **Tables:** 124

---

## Installed Plugins

### Generic Plugins (21)
- acron (Scheduled tasks)
- announcementFeed
- citationStyleLanguage
- crossref (DOI integration)
- customBlockManager
- datacite
- driver (Repository protocol)
- dublinCoreMeta (Metadata)
- googleAnalytics
- googleScholar (Indexing)
- htmlArticleGalley
- lensGalley (Article viewer)
- orcidProfile (Author identification)
- pdfJsViewer
- recommendByAuthor
- recommendBySimilarity
- reviewerCredits
- staticPages
- tinymce (Editor)
- usageEvent (Statistics)
- webFeed (RSS)

### Themes (2)
- **calcium** (Custom theme)
- **default** (Standard OJS theme)

---

## Migration Requirements

### Data to Transfer
1. **OJS Core Installation** (347 MB)
   - Application files
   - Configuration
   - Plugins & themes
   - Cache directory

2. **User Files** (763 MB)
   - Article submissions
   - PDFs and supplementary files
   - Author uploads
   - Gallery files

3. **Database** (10.81 MB)
   - Full database dump
   - 124 tables
   - User accounts, submissions, reviews, etc.

### Configuration Files to Preserve
- `config.inc.php` (main configuration)
- `.htaccess` / nginx configuration
- Plugin configurations
- Custom theme settings

---

## Pre-Migration Checklist

### ✅ Information Gathered
- [x] OJS version identified (3.4.0.3)
- [x] Storage requirements calculated (~1.12 GB)
- [x] Database size determined (10.81 MB)
- [x] Plugin list documented
- [x] PHP version confirmed (8.3.15)
- [x] MySQL version confirmed (8.0.44)

### 📋 Migration Planning

**Estimated Downtime:** 30-60 minutes

**Transfer Requirements:**
- Database dump: ~11 MB
- Application files: ~347 MB
- User files: ~763 MB
- **Total transfer:** ~1.12 GB

**New Server Requirements:**
- ✓ PHP 8.3+ (compatible)
- ✓ MySQL 8.0+ (compatible)
- ✓ Nginx/Apache
- ✓ Required PHP extensions
- ✓ ~2 GB disk space (with headroom)

---

## Migration Strategy

### Phase 1: Preparation
1. **Backup current installation**
   - Database dump
   - Files archive
   - Configuration backup

2. **Server setup (new)**
   - Install Nginx
   - Install PHP 8.3 + required extensions
   - Install MySQL 8.0
   - Configure firewall

### Phase 2: Installation
1. **Copy OJS core files** (347 MB)
2. **Copy user files** (763 MB)
3. **Import database** (10.81 MB)
4. **Update config.inc.php**
   - Database credentials
   - Files path
   - Base URL (if needed)

### Phase 3: Configuration
1. Set file permissions
2. Configure Nginx vhost
3. SSL certificate (via Cloudflare)
4. Test OJS functionality

### Phase 4: Validation
1. Test user login
2. Test article submission
3. Test file downloads
4. Verify plugins
5. Check frontend/backend access

### Phase 5: DNS Cutover
1. Update A record (already behind Cloudflare)
2. Monitor logs
3. Performance testing

---

## Compatibility Notes

### ✅ Fully Compatible
- PHP 8.3.15 → PHP 8.3+ (same major version)
- MySQL 8.0.44 → MySQL 8.0+ (same version)
- Ubuntu 24.04.1 → Ubuntu 24.04.3 (same release)

### ⚠️ To Verify After Migration
- Nginx configuration compatibility
- File permissions
- Plugin functionality
- Theme rendering
- Scheduled tasks (acron)
- Email configuration

---

## Performance Impact Estimate

Based on server benchmarks:

| Operation | Old Server | New Server | Improvement |
|-----------|-----------|------------|-------------|
| **File Upload** | Standard | 200x faster | Major boost |
| **Database Queries** | Baseline | 250x faster IOPS | Huge improvement |
| **Page Generation** | Baseline | 3x faster CPU | Significant |
| **Concurrent Users** | Limited (2GB RAM) | Better (4GB RAM) | 2x capacity |

**Expected User Experience:**
- Faster page loads
- Quicker article downloads
- Better handling of multiple users
- Smoother admin operations
- Faster search/indexing

---

## Risk Assessment

### Low Risk
- ✅ Same software versions (no upgrade)
- ✅ Small database (10.81 MB - easy to backup/restore)
- ✅ Standard OJS installation
- ✅ Behind Cloudflare (easy rollback)

### Mitigation
- Full backup before migration
- Keep old server running during validation
- DNS behind Cloudflare (instant rollback)
- Test environment available

---

## Post-Migration Validation Checklist

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] User login works
- [ ] Admin panel accessible
- [ ] Article browsing functional
- [ ] PDF downloads work
- [ ] Search functionality
- [ ] Article submission process
- [ ] Email notifications
- [ ] Scheduled tasks running
- [ ] All plugins active

### Performance Tests
- [ ] Page load times improved
- [ ] File upload speed
- [ ] Database query performance
- [ ] Concurrent user handling
- [ ] Resource usage monitoring

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Server Preparation | 30 min | Software installation |
| File Transfer | 15 min | ~1.12 GB transfer |
| Configuration | 15 min | Setup & permissions |
| Testing | 15 min | Validation |
| DNS Cutover | 5 min | Update records |
| Monitoring | 30 min | Post-migration watch |
| **Total** | **~2 hours** | Including buffer |

**Actual Downtime:** 30-60 minutes (during cutover)

---

## Conclusion

**OJS Installation Status:** ✅ Healthy, Ready to Migrate

**Size:** Manageable (~1.12 GB total)

**Complexity:** Low (standard installation, no customizations)

**Risk Level:** Low (same software versions, full backups available)

**Recommendation:** Proceed with migration - straightforward process expected.

---

*Next: Awaiting migration approval to proceed with backup and transfer.*
