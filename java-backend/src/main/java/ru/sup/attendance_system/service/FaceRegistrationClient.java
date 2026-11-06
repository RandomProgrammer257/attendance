package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import ru.sup.attendance_system.dto.FaceEmbeddingResponse;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class FaceRegistrationClient {

    @Value("${face.registration-url:http://127.0.0.1:8001/register}")
    private String registrationUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public float[] extractEmbedding(
            byte[] imageBytes,
            String filename,
            String contentType
    ) {
        ByteArrayResource imageResource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename != null ? filename : "photo.jpg";
            }
        };

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(
                MediaType.parseMediaType(contentType)
        );

        HttpEntity<ByteArrayResource> fileEntity =
                new HttpEntity<>(imageResource, fileHeaders);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileEntity);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request =
                new HttpEntity<>(body, headers);

        try {
            FaceEmbeddingResponse response = restTemplate.postForObject(
                    registrationUrl,
                    request,
                    FaceEmbeddingResponse.class
            );

            if (response == null
                    || response.getVector() == null
                    || response.getVector().isEmpty()) {
                throw new IllegalStateException(
                        "Python-сервис не вернул вектор лица"
                );
            }

            java.util.List<Double> vector = response.getVector();

            float[] result = new float[vector.size()];

            for (int i = 0; i < vector.size(); i++) {
                result[i] = vector.get(i).floatValue();
            }

            return result;

        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException(
                    "Ошибка обработки фотографии: " + e.getResponseBodyAsString(),
                    e
            );
        }
    }
}

