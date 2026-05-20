package com.projeto.logistica.repository;

// import exception.NegocioException;
import com.projeto.logistica.model.Produto;

// import javax.xml.transform.Result;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import javax.xml.transform.Result;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Repository
public class ProdutoRepositorySQL implements ProdutoRepository {
    private final Connection conn;

    public ProdutoRepositorySQL(DataSource dataSource){
        try{
            this.conn = dataSource.getConnection();
        } catch (SQLException e) {
            throw new RuntimeException(e.getMessage());
        }
    }
    @Override
    public void salvar(Produto p) {
        String sql = "INSERT INTO produto (nome, preco, quantidade) VALUES (?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, p.getNome());
            stmt.setDouble(2, p.getPreco());
            stmt.setInt(3, p.getQuantidade());
            stmt.executeUpdate();
            try(ResultSet rs = stmt.getGeneratedKeys()){
                if(rs.next()){
                    p.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao salvar: " + e.getMessage());
        }
    }

    @Override
    public void removerPorId(int id) {
        String sql = "DELETE FROM produto WHERE id = ?";
        try(PreparedStatement stmt = conn.prepareStatement(sql)){
            stmt.setInt(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Produto buscarPorId(int id) {
        String sql = "SELECT id, nome, preco, quantidade FROM produto WHERE id = ?";
        try(PreparedStatement stmt = conn.prepareStatement(sql)){
            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if(rs.next()) {
                Produto p = new Produto(
                        rs.getString("nome"),
                        rs.getDouble("preco"),
                        rs.getInt("quantidade")
                );
                p.setId(rs.getInt("id"));
                return p;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    @Override
    public List<Produto> listarTodos() {
        List<Produto> lista = new ArrayList<>();
        String sql = "SELECT * FROM produto ORDER BY id ASC";
        try(PreparedStatement stmt = conn.prepareStatement(sql)){
            ResultSet rs = stmt.executeQuery();

            while(rs.next()){
                Produto prod = new Produto(
                        rs.getString("nome"),
                        rs.getDouble("preco"),
                        rs.getInt("quantidade"));
                prod.setId(rs.getInt("id"));
                lista.add(prod);
            }
        }catch (SQLException e){
            throw new RuntimeException("Erro: " + e.getMessage());
        }
        return lista;
    }

    @Override
    public void registrarVenda(int id, int novaQuantidade, int quantidadeVendida) {
        String sqlUpd = "UPDATE produto SET quantidade = ? WHERE id = ?";
        String sqlIns = "INSERT INTO historico_vendas(produto_id, quantidade_vendida) VALUES (?, ?)";

        try{
            conn.setAutoCommit(false); // Desligar a assinatura automática do Banco com o java

            try(PreparedStatement stmtU = conn.prepareStatement(sqlUpd)){
                stmtU.setInt(1, novaQuantidade);
                stmtU.setInt(2, id);
                stmtU.executeUpdate();
            }

            try(PreparedStatement stmtI = conn.prepareStatement(sqlIns)){
                stmtI.setInt(1, id);
                stmtI.setInt(2, quantidadeVendida);
                stmtI.executeUpdate();
            }

            conn.commit();
        }catch (SQLException e){
            try{
                if(conn != null){
                    conn.rollback();
                    System.err.println("Rollback executado devido a erro: " + e.getMessage());
                }
            } catch (SQLException ex) {
                e.printStackTrace();
            }
            throw new RuntimeException("Falha ao registrar venda no banco.");
        }finally {
            try{
                if(conn != null){
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public Produto atualizarProduto(int id, Produto produto) {
        String sql = "UPDATE produto SET nome = ?, preco = ?, quantidade = ? WHERE id = ?";

        try(PreparedStatement stmt = conn.prepareStatement(sql);){
            stmt.setString(1, produto.getNome());
            stmt.setDouble(2, produto.getPreco());
            stmt.setInt(3, produto.getQuantidade());
            stmt.setInt(4, id);

            stmt.executeUpdate();

            produto.setId(id);
            return produto;
        }catch (SQLException e){
            System.out.println(e.getMessage());
        }
        return null;
    }

    @Override
    public String buscarPorNome(String nome) {
        String sql = "SELECT nome FROM produto WHERE LOWER(nome) = LOWER(?)";

        try(PreparedStatement stmt = conn.prepareStatement(sql)){
            stmt.setString(1, nome);
            try(ResultSet rs = stmt.executeQuery()){
                if(rs.next()){
                    return rs.getString("nome");
                }
            }

        } catch (SQLException e) {
            System.out.println("Erro ao verificar nome: " + e.getMessage());
        }
        return null;
    }

}