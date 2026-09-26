package com.meshnet.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TrustedNodeDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(node: TrustedNodeEntity)

    @Query("SELECT EXISTS(SELECT 1 FROM trusted_nodes WHERE publicKeyBase64 = :publicKeyBase64)")
    suspend fun isTrusted(publicKeyBase64: String): Boolean

    @Query("SELECT * FROM trusted_nodes ORDER BY pairedAtMillis DESC")
    fun observeAll(): Flow<List<TrustedNodeEntity>>

    @Query("DELETE FROM trusted_nodes WHERE publicKeyBase64 = :publicKeyBase64")
    suspend fun delete(publicKeyBase64: String)
}
