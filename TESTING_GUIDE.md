# Testing Guide: Rooms API Diagnostics

## Quick Test Commands

### 1. Run Local Diagnostic Script
```bash
node scripts/test-rooms-api.js
```

This will test:
- ✅ Environment variables
- ✅ Direct Supabase connection
- ✅ Local API endpoint (if server running)
- ✅ Production API endpoint
- ✅ Test endpoint

### 2. Test Production API Directly
```bash
# Main API endpoint
curl https://pulsechat.space/api/rooms?sort=activity

# Test endpoint (simpler, should always work)
curl https://pulsechat.space/api/rooms/test

# Debug endpoint (comprehensive diagnostics)
curl https://pulsechat.space/api/debug/rooms
```

### 3. Check Browser Console
1. Open https://pulsechat.space
2. Open DevTools (F12)
3. Go to Console tab
4. Look for logs prefixed with:
   - `[ROOMS API]` - API route logs
   - `[DIALOG]` - JoinRoomDialog logs
   - `[ROOMS]` - App page logs

### 4. Check Vercel Logs
```bash
# View recent logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

## Common Issues & Solutions

### Issue: "No rooms available"
**Diagnosis:**
1. Run `node scripts/test-rooms-api.js`
2. Check which test fails

**Solutions:**
- If Supabase direct fails → Check credentials
- If API fails but test endpoint works → Check route logic
- If both fail → Check Vercel environment variables

### Issue: API returns empty array
**Check:**
1. Visit `/api/debug/rooms` - shows detailed diagnostics
2. Check Vercel logs for `[ROOMS API]` errors
3. Verify database is seeded: `node scripts/seed-via-api.js`

### Issue: Rooms show in test endpoint but not main API
**Likely cause:** Query ordering issue or error handling
**Fix:** Check if error is being silently caught

## Expected Results

### ✅ Healthy System
- Supabase direct: 6 rooms
- Test endpoint: 6 rooms
- Production API: 6 rooms
- Debug endpoint: All tests pass

### ❌ Unhealthy System
- Any test fails → Check that specific layer
- Database not seeded → Run seed script
- Environment variables missing → Set in Vercel dashboard

## Debug Endpoints

### `/api/rooms/test`
Simple endpoint that directly queries Supabase. Should always work if database is seeded.

### `/api/debug/rooms`
Comprehensive diagnostic endpoint showing:
- Environment variable status
- Supabase query results
- Prisma query results
- Main API simulation
- Overall health status

## Next Steps After Testing

1. **If Supabase works but API doesn't:**
   - Check route logic
   - Check error handling
   - Check Vercel logs

2. **If nothing works:**
   - Verify environment variables in Vercel
   - Check database connection
   - Verify database is seeded

3. **If everything works but frontend doesn't show:**
   - Check browser console
   - Check network tab for API calls
   - Check Zustand store state
   - Check filtering logic in JoinRoomDialog

