package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.User;

import java.util.List;

public interface UserService {
    User save(User user);

    User findByEmail(String email);

    List<User> findAll();
}
