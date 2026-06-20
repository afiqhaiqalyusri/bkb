package com.bkb.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "toyyibpay")
@Getter
@Setter
public class ToyyibPayProperties {
    private String baseUrl;
    private String secretKey;
    private String categoryCode;
    private String callbackUrl;
    private String returnUrl;
}
