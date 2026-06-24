package com.bkb.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Repair aligns the checksums in the database with the squashed migration file
            // and marks the removed V2-V28 migrations as deleted so Flyway doesn't panic.
            flyway.repair();
            flyway.migrate();
        };
    }
}
