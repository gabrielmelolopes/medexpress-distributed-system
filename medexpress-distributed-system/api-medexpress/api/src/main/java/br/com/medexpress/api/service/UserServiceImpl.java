package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.User;
import br.com.medexpress.api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService{
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    @Override
    public User save(User user) {
        if(user.getEmail() == null || user.getEmail().trim().isBlank()){
            throw new IllegalArgumentException("O e-mail é obrigatório para o cadastro.");
        }
        if(user.getPassword() == null || user.getPassword().trim().isBlank()){
            throw new IllegalArgumentException("A senha é obrigatória");
        }

        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if(existingUser.isPresent()){
            throw new IllegalArgumentException("Este e-mail já está cadastrado no sistema");
        }
        return userRepository.save(user);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado com o e-mail" + email));
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }
}
