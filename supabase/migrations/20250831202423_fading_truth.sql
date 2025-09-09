@@ .. @@
 CREATE POLICY "Seuls les admins peuvent modifier les départements"
     ON departements FOR ALL
     TO authenticated
     USING (
         EXISTS (
-            SELECT 1 FROM auth.users
-            WHERE auth.users.id = auth.uid()
-            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
+            SELECT 1 FROM users
+            WHERE users.id = auth.uid()
+            AND users.role IN ('ADMIN', 'SUPER_ADMIN')
         )
     );