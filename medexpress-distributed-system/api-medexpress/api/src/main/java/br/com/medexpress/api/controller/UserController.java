package br.com.medexpress.api.controller;

import br.com.medexpress.api.domain.User;
import br.com.medexpress.api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> save(@RequestBody User user){
        User savedUser = userService.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody User loginData) {
        // Buscamos o usuário pelo e-mail
        User user = userService.findByEmail(loginData.getEmail());

        // Verificamos se ele existe e se a senha confere
        if (user != null && user.getPassword().equals(loginData.getPassword())) {
            return ResponseEntity.ok(user);
        }

        return ResponseEntity.status(401).build(); // Retorna 401 Unauthorized se falhar
    }
    @GetMapping
    public ResponseEntity<List<User>> findAll(){
        List<User> list = userService.findAll();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/search")
    public ResponseEntity<User> findByEmail(@RequestParam String email){
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(user);
    }
}
