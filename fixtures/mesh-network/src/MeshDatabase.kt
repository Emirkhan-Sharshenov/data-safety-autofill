package com.meshnet.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters

class Converters {
    @TypeConverter
    fun fromPriority(value: Priority): String = value.name

    @TypeConverter
    fun toPriority(value: String): Priority = Priority.valueOf(value)
}

@Database(entities = [MessageEntity::class, TrustedNodeEntity::class], version = 3, exportSchema = false)
@TypeConverters(Converters::class)
abstract class MeshDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
    abstract fun trustedNodeDao(): TrustedNodeDao

    companion object {
        @Volatile private var instance: MeshDatabase? = null

        fun get(context: Context): MeshDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MeshDatabase::class.java,
                    "mesh.db"
                )
                    // Pre-release schema; no persisted data worth migrating yet.
                    .fallbackToDestructiveMigration()
                    .build().also { instance = it }
            }
    }
}
