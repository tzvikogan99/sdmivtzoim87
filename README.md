mkdir -p /home/claude/shiur-daled-mivtzoim && cd /home/claude/shiur-daled-mivtzoim && mkdir -p app/api/auth/signup app/api/activities app/api/categories app/api/groups app/api/routes app/api/invitations app/api/weeks app/api/admin/stats \
  "app/(auth)/login" "app/(auth)/signup" \
  "app/(app)/dashboard" "app/(app)/mivtzoim" "app/(app)/groups/[id]" "app/(app)/routes/[id]" "app/(app)/weekly" "app/(app)/history" "app/(app)/profile" \
  "app/(admin)/admin/users" "app/(admin)/admin/groups" "app/(admin)/admin/weeks" \
  lib components prisma
echo done
Output

done
