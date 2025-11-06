// resources/js/diagram/utils/simpleFlutterGenerator.js
// Generador de aplicaciones Flutter completas desde diagramas UML

import JSZip from 'jszip';

export class SimpleFlutterGenerator {
    constructor(editor) {
        this.editor = editor;
        this.graph = editor.graph;
        this.projectName = 'flutter_app';
        this.packageName = 'com.example.flutter_app';
        this.baseUrl = '10.0.2.2:8080'; // Localhost para Android

        // Análisis del diagrama
        this.classes = [];
        this.hasAuthentication = false;
        this.authEntity = null;
        this.relationships = [];

        console.log('📱 SimpleFlutterGenerator inicializado');
    }

    // ==================== MÉTODO PRINCIPAL ====================

    async generateFlutterProject() {
        try {
            console.log('📱 Iniciando generación de proyecto Flutter...');

            // Analizar diagrama
            this.analyzeDiagram();

            // Crear ZIP del proyecto
            const zip = new JSZip();

            // Generar estructura del proyecto
            await this.generateProjectStructure(zip);

            // Generar archivos principales
            await this.generateMainFiles(zip);

            // Generar configuración
            await this.generateConfigFiles(zip);

            // Generar modelos
            await this.generateModels(zip);

            // Generar servicios
            await this.generateServices(zip);

            // Generar pantallas
            await this.generateScreens(zip);

            // Generar widgets comunes
            await this.generateCommonWidgets(zip);

            // Generar providers (estado)
            await this.generateProviders(zip);

            // Generar archivos de configuración Flutter
            await this.generateFlutterConfig(zip);

            // Descargar ZIP
            const blob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.projectName}_flutter.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Proyecto Flutter generado exitosamente');

            return {
                success: true,
                message: `Proyecto Flutter generado: ${this.projectName}`,
                entitiesCount: this.classes.length,
                hasAuth: this.hasAuthentication
            };

        } catch (error) {
            console.error('❌ Error generando proyecto Flutter:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== ANÁLISIS DEL DIAGRAMA ====================

    analyzeDiagram() {
        const elements = this.graph.getElements();
        const links = this.graph.getLinks();

        console.log('🔍 Analizando diagrama para Flutter...');

        // Extraer clases
        this.classes = elements.map(element => {
            const umlData = element.get('umlData') || {};
            return {
                id: element.id,
                name: umlData.className || 'UnnamedClass',
                type: umlData.type || 'class',
                attributes: umlData.attributes || [],
                methods: umlData.methods || [],
                tableName: this.toSnakeCase(umlData.className || 'UnnamedClass'),
                className: this.toPascalCase(umlData.className || 'UnnamedClass'),
                variableName: this.toCamelCase(umlData.className || 'UnnamedClass')
            };
        });

        // Detectar autenticación
        this.detectAuthentication();

        // Extraer relaciones
        this.relationships = links.map(link => {
            const linkData = link.get('linkData') || {};
            const sourceElement = link.getSourceElement();
            const targetElement = link.getTargetElement();

            return {
                id: link.id,
                type: linkData.type || 'association',
                source: sourceElement?.get('umlData')?.className || 'Unknown',
                target: targetElement?.get('umlData')?.className || 'Unknown',
                sourceMultiplicity: linkData.sourceMultiplicity,
                targetMultiplicity: linkData.targetMultiplicity
            };
        });

        console.log(`📊 Análisis completado: ${this.classes.length} clases, ${this.relationships.length} relaciones`);
        console.log(`🔐 Autenticación detectada: ${this.hasAuthentication ? 'SÍ' : 'NO'}`);
    }

    detectAuthentication() {
        // Buscar clases con campos de autenticación
        for (const cls of this.classes) {
            const attributes = cls.attributes || [];
            const hasEmail = attributes.some(attr => {
                const attrName = typeof attr === 'string' ? attr : attr.name;
                return attrName.toLowerCase().includes('email') ||
                       attrName.toLowerCase().includes('username');
            });
            const hasPassword = attributes.some(attr => {
                const attrName = typeof attr === 'string' ? attr : attr.name;
                return attrName.toLowerCase().includes('password') ||
                       attrName.toLowerCase().includes('pass');
            });

            if (hasEmail && hasPassword) {
                this.hasAuthentication = true;
                this.authEntity = cls;
                console.log(`🔐 Entidad de autenticación detectada: ${cls.name}`);
                break;
            }
        }
    }

    // ==================== GENERACIÓN DE ESTRUCTURA ====================

    async generateProjectStructure(zip) {
        console.log('📁 Generando estructura del proyecto...');

        // Estructura básica de Flutter
        const folders = [
            'lib',
            'lib/config',
            'lib/models',
            'lib/services',
            'lib/providers',
            'lib/screens',
            'lib/screens/auth',
            'lib/screens/home',
            'lib/screens/entities',
            'lib/widgets',
            'lib/widgets/common',
            'lib/utils',
            'android',
            'android/app',
            'android/gradle',
            'android/gradle/wrapper',
            'android/app/src',
            'android/app/src/main',
            'android/app/src/main/kotlin',
            `android/app/src/main/kotlin/${this.packageName.replace(/\./g, '/')}`,
            'ios',
            'ios/Runner'
        ];

        folders.forEach(folder => {
            zip.folder(folder);
        });
    }

    // ==================== ARCHIVOS PRINCIPALES ====================

    async generateMainFiles(zip) {
        console.log('📄 Generando archivos principales...');

        // main.dart
        zip.file('lib/main.dart', this.generateMainDart());

        // app.dart
        zip.file('lib/app.dart', this.generateAppDart());

        // routes.dart
        zip.file('lib/config/routes.dart', this.generateRoutes());
    }

    generateMainDart() {
        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'services/api_service.dart';
${this.generateProviderImports()}

void main() {
  // Initialize API Service
  ApiService().initialize();

  runApp(
    MultiProvider(
      providers: [
${this.generateProvidersList()}
      ],
      child: MyApp(),
    ),
  );
}`;
    }

    generateAppDart() {
        return `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'config/routes.dart';
import 'config/theme.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '${this.projectName.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      routerConfig: AppRoutes.router,
      debugShowCheckedModeBanner: false,
    );
  }
}`;
    }

    // ==================== CONFIGURACIÓN ====================

    async generateConfigFiles(zip) {
        console.log('⚙️ Generando archivos de configuración...');

        // API Config
        zip.file('lib/config/api_config.dart', this.generateApiConfig());

        // Theme Config
        zip.file('lib/config/theme.dart', this.generateThemeConfig());

        // Constants
        zip.file('lib/utils/constants.dart', this.generateConstants());
    }

    generateApiConfig() {
        return `import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Detectar plataforma y usar URL apropiada
  static String get baseUrl {
    if (kIsWeb) {
      // Para Flutter Web usar localhost
      return 'http://localhost:8080/api';
    } else {
      // Para Android emulador usar 10.0.2.2
      // Para iOS simulador, cambiar a 'http://localhost:8080/api'
      return 'http://10.0.2.2:8080/api';
    }
  }

  // Endpoints
  static const String auth = '/auth';
  static const String login = '/auth/login';
  static const String register = '/auth/register';

  // Entity endpoints
${this.classes.map(cls => `  static const String ${cls.variableName} = '/${cls.tableName}';`).join('\n')}

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Headers
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static Map<String, String> authHeaders(String token) => {
    ...headers,
    'Authorization': 'Bearer \$token',
  };
}`;
    }

    generateThemeConfig() {
        return `import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color secondaryColor = Color(0xFF03DAC6);
  static const Color errorColor = Color(0xFFB00020);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.dark,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
    );
  }
}`;
    }

    // ==================== MODELOS ====================

    async generateModels(zip) {
        console.log('🏗️ Generando modelos...');

        for (const cls of this.classes) {
            const modelContent = this.generateModelClass(cls);
            zip.file(`lib/models/${cls.tableName}_model.dart`, modelContent);
        }
    }

    generateModelClass(cls) {
        const attributes = this.parseAttributes(cls.attributes);

        // Agregar ID si no existe
        const hasId = attributes.some(attr => attr.name.toLowerCase() === 'id');
        if (!hasId) {
            attributes.unshift({
                name: 'id',
                type: 'int',
                dartType: 'int',
                visibility: '+',
                nullable: true,
                required: false,
                jsonKey: 'id'
            });
        }

        return `class ${cls.className} {
${attributes.map(attr => `  final ${attr.dartType}? ${attr.name};`).join('\n')}

  ${cls.className}({
${attributes.map(attr => `    this.${attr.name},`).join('\n')}
  });

  factory ${cls.className}.fromJson(Map<String, dynamic> json) {
    return ${cls.className}(
${attributes.map(attr => `      ${attr.name}: json['${attr.jsonKey}'],`).join('\n')}
    );
  }

  Map<String, dynamic> toJson() {
    return {
${attributes.map(attr => `      '${attr.jsonKey}': ${attr.name},`).join('\n')}
    };
  }

  ${cls.className} copyWith({
${attributes.map(attr => `    ${attr.dartType}? ${attr.name},`).join('\n')}
  }) {
    return ${cls.className}(
${attributes.map(attr => `      ${attr.name}: ${attr.name} ?? this.${attr.name},`).join('\n')}
    );
  }

  @override
  String toString() {
    return '${cls.className}(id: \$id)';
  }
}`;
    }    // ==================== SERVICIOS ====================

    async generateServices(zip) {
        console.log('🔧 Generando servicios...');

        // API Service base
        zip.file('lib/services/api_service.dart', this.generateApiService());

        // Auth Service
        if (this.hasAuthentication) {
            zip.file('lib/services/auth_service.dart', this.generateAuthService());
        }

        // Entity Services
        for (const cls of this.classes) {
            const serviceContent = this.generateEntityService(cls);
            zip.file(`lib/services/${cls.tableName}_service.dart`, serviceContent);
        }
    }

    generateApiService() {
        return `import 'package:dio/dio.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: ApiConfig.headers,
    ));

    // Interceptors
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  Dio get dio => _dio;

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer \$token';
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}`;
    }

    generateEntityService(cls) {
        return `import 'package:dio/dio.dart';
import '../models/${cls.tableName}_model.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class ${cls.className}Service {
  final ApiService _apiService = ApiService();

  Future<List<${cls.className}>> getAll() async {
    try {
      final response = await _apiService.dio.get(ApiConfig.${cls.variableName});

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => ${cls.className}.fromJson(json)).toList();
      }

      throw Exception('Failed to load ${cls.tableName}');
    } on DioException catch (e) {
      throw Exception('Network error: \${e.message}');
    }
  }

  Future<${cls.className}> getById(int id) async {
    try {
      final response = await _apiService.dio.get('\${ApiConfig.${cls.variableName}}/\$id');

      if (response.statusCode == 200) {
        return ${cls.className}.fromJson(response.data);
      }

      throw Exception('${cls.className} not found');
    } on DioException catch (e) {
      throw Exception('Network error: \${e.message}');
    }
  }

  Future<${cls.className}> create(${cls.className} ${cls.variableName}) async {
    try {
      final response = await _apiService.dio.post(
        ApiConfig.${cls.variableName},
        data: ${cls.variableName}.toJson(),
      );

      if (response.statusCode == 201) {
        return ${cls.className}.fromJson(response.data);
      }

      throw Exception('Failed to create ${cls.tableName}');
    } on DioException catch (e) {
      throw Exception('Network error: \${e.message}');
    }
  }

  Future<${cls.className}> update(int id, ${cls.className} ${cls.variableName}) async {
    try {
      final response = await _apiService.dio.put(
        '\${ApiConfig.${cls.variableName}}/\$id',
        data: ${cls.variableName}.toJson(),
      );

      if (response.statusCode == 200) {
        return ${cls.className}.fromJson(response.data);
      }

      throw Exception('Failed to update ${cls.tableName}');
    } on DioException catch (e) {
      throw Exception('Network error: \${e.message}');
    }
  }

  Future<void> delete(int id) async {
    try {
      final response = await _apiService.dio.delete('\${ApiConfig.${cls.variableName}}/\$id');

      if (response.statusCode != 204) {
        throw Exception('Failed to delete ${cls.tableName}');
      }
    } on DioException catch (e) {
      throw Exception('Network error: \${e.message}');
    }
  }
}`;
    }

    // ==================== PANTALLAS ====================

    async generateScreens(zip) {
        console.log('📱 Generando pantallas...');

        // Auth screens
        if (this.hasAuthentication) {
            zip.file('lib/screens/auth/login_screen.dart', this.generateLoginScreen());
            zip.file('lib/screens/auth/register_screen.dart', this.generateRegisterScreen());
        }

        // Home screen
        zip.file('lib/screens/home/home_screen.dart', this.generateHomeScreen());

        // Entity screens
        for (const cls of this.classes) {
            // List screen
            zip.file(`lib/screens/entities/${cls.tableName}_list_screen.dart`,
                    this.generateListScreen(cls));

            // Form screen
            zip.file(`lib/screens/entities/${cls.tableName}_form_screen.dart`,
                    this.generateFormScreen(cls));
        }
    }

    generateLoginScreen() {
        if (!this.hasAuthentication) return '';

        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo/Title
                Text(
                  '${this.projectName.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Email field
                CustomTextField(
                  controller: _emailController,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Email is required';
                    }
                    if (!value!.contains('@')) {
                      return 'Invalid email format';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  obscureText: true,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Password is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Login button
                CustomButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  text: 'Login',
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 16),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Don\\'t have an account? '),
                    TextButton(
                      onPressed: () => context.go('/register'),
                      child: const Text('Register'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (mounted) {
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: \$e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}`;
    }

    generateRegisterScreen() {
        if (!this.hasAuthentication) return '';

        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),

                // Title
                Text(
                  'Create Account',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign up to get started',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Name field
                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email field
                CustomTextField(
                  controller: _emailController,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Email is required';
                    }
                    if (!value!.contains('@')) {
                      return 'Invalid email format';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  obscureText: true,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Password is required';
                    }
                    if (value!.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Confirm Password field
                CustomTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  obscureText: true,
                  validator: (value) {
                    if (value?.isEmpty ?? true) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Register button
                CustomButton(
                  onPressed: _isLoading ? null : _handleRegister,
                  text: 'Register',
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 16),

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account? '),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Login'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.register(
        _nameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful! Please login.')),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration failed: \$e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}`;
    }

    generateHomeScreen() {
        return `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          ${this.hasAuthentication ? `
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _handleLogout(context),
          ),
          ` : ''}
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.count(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          children: [
${this.classes.map(cls => `            _buildMenuCard(
              context,
              '${cls.name}',
              Icons.table_view,
              '/${cls.tableName}',
            ),`).join('\n')}
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context,
    String title,
    IconData icon,
    String route,
  ) {
    return Card(
      child: InkWell(
        onTap: () => context.go(route),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).primaryColor),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  ${this.hasAuthentication ? `
  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Clear auth and navigate to login
              context.go('/login');
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
  ` : ''}
}`;
    }

    // ==================== FLUTTER CONFIG ====================

    async generateFlutterConfig(zip) {
        console.log('⚙️ Generando configuración de Flutter...');

        // pubspec.yaml
        zip.file('pubspec.yaml', this.generatePubspec());

        // analysis_options.yaml
        zip.file('analysis_options.yaml', this.generateAnalysisOptions());

        // Android config
        zip.file('android/app/build.gradle', this.generateAndroidBuildGradle());
        zip.file('android/app/src/main/AndroidManifest.xml', this.generateAndroidManifest());
        zip.file(`android/app/src/main/kotlin/${this.packageName.replace(/\./g, '/')}/MainActivity.kt`, this.generateMainActivity());
        zip.file('android/build.gradle', this.generateRootBuildGradle());
        zip.file('android/gradle.properties', this.generateGradleProperties());
        zip.file('android/settings.gradle', this.generateSettingsGradle());
        zip.file('android/gradle/wrapper/gradle-wrapper.properties', this.generateGradleWrapperProperties());

        // Android resources
        zip.file('android/app/src/main/res/values/styles.xml', this.generateAndroidStylesXml());
        zip.file('android/app/src/main/res/values-night/styles.xml', this.generateAndroidStylesNightXml());
        zip.file('android/app/src/main/res/drawable/launch_background.xml', this.generateLaunchBackgroundXml());
        zip.file('android/app/src/main/res/drawable-v21/launch_background.xml', this.generateLaunchBackgroundV21Xml());

        // Android launcher icons (placeholder for all densities)
        const iconBase64 = this.generateAndroidIconPlaceholder();
        const densities = ['hdpi', 'mdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
        densities.forEach(density => {
            zip.file(`android/app/src/main/res/mipmap-${density}/ic_launcher.png`, iconBase64, {base64: true});
        });

        // iOS config basic
        zip.file('ios/Runner/Info.plist', this.generateInfoPlist());
    }

    generatePubspec() {
        return `name: ${this.projectName}
description: Generated Flutter app from UML diagram

publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter

  # State management
  provider: ^6.1.1

  # HTTP client
  dio: ^5.3.2

  # Navigation
  go_router: ^12.1.1

  # UI
  cupertino_icons: ^1.0.6

  # Storage
  shared_preferences: ^2.2.2

  # Utils
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1

flutter:
  uses-material-design: true

  # assets:
  #   - images/a_dot_burr.jpeg

  # fonts:
  #   - family: Schyler
  #     fonts:
  #       - asset: fonts/Schyler-Regular.ttf`;
    }

    // ==================== UTILIDADES ====================

    parseAttributes(attributes) {
        return attributes.map(attr => {
            // Parse "- name: Type" or "+ name: Type"
            const match = attr.match(/^([+\-#~]?)\s*(\w+):\s*(.+)$/);
            if (match) {
                const [, visibility, name, type] = match;
                const camelName = this.toCamelCase(name);
                return {
                    name: camelName,
                    type: type.trim(),
                    dartType: this.mapToDartType(type.trim()),
                    visibility: visibility || '+',
                    nullable: type.includes('?'),
                    required: !type.includes('?') && name.toLowerCase() !== 'id',
                    jsonKey: camelName // Usar camelCase para coincidir con backend Java
                };
            }
            const camelName = this.toCamelCase(attr);
            return {
                name: camelName,
                type: 'String',
                dartType: 'String',
                visibility: '+',
                nullable: true,
                required: false,
                jsonKey: camelName // Usar camelCase para coincidir con backend Java
            };
        });
    }

    mapToDartType(type) {
        const typeMap = {
            'String': 'String',
            'int': 'int',
            'Integer': 'int',
            'boolean': 'bool',
            'Boolean': 'bool',
            'double': 'double',
            'Double': 'double',
            'float': 'double',
            'Float': 'double',
            'Date': 'DateTime',
            'LocalDateTime': 'DateTime',
            'DateTime': 'DateTime',
            'BigDecimal': 'double',
            'List': 'List',
            'Set': 'Set',
            'Map': 'Map'
        };

        return typeMap[type] || 'String';
    }

    generateProviderImports() {
        const imports = [];
        if (this.hasAuthentication) {
            imports.push("import 'providers/auth_provider.dart';");
        }

        this.classes.forEach(cls => {
            imports.push(`import 'providers/${cls.tableName}_provider.dart';`);
        });

        return imports.join('\n');
    }

    generateProvidersList() {
        const providers = [];

        if (this.hasAuthentication) {
            providers.push('        ChangeNotifierProvider(create: (_) => AuthProvider()),');
        }

        this.classes.forEach(cls => {
            providers.push(`        ChangeNotifierProvider(create: (_) => ${cls.className}Provider()),`);
        });

        return providers.join('\n');
    }

    generateRoutes() {
        const routes = [];

        // Ruta inicial
        if (this.hasAuthentication) {
            routes.push('    GoRoute(path: \'/\', redirect: (context, state) => \'/login\'),');
            routes.push('    GoRoute(path: \'/login\', builder: (context, state) => LoginScreen()),');
            routes.push('    GoRoute(path: \'/register\', builder: (context, state) => RegisterScreen()),');
        } else {
            routes.push('    GoRoute(path: \'/\', redirect: (context, state) => \'/home\'),');
        }

        routes.push('    GoRoute(path: \'/home\', builder: (context, state) => HomeScreen()),');

        // Rutas de entidades
        this.classes.forEach(cls => {
            routes.push(`    GoRoute(path: \'/${cls.tableName}\', builder: (context, state) => ${cls.className}ListScreen()),`);
            routes.push(`    GoRoute(path: \'/${cls.tableName}/form\', builder: (context, state) => ${cls.className}FormScreen()),`);
            routes.push(`    GoRoute(path: \'/${cls.tableName}/form/:id\', builder: (context, state) => ${cls.className}FormScreen(id: int.tryParse(state.pathParameters[\'id\'] ?? \'\'))),`);
        });

        return `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
${this.hasAuthentication ? `import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';` : ''}
import '../screens/home/home_screen.dart';
${this.classes.map(cls => `import '../screens/entities/${cls.tableName}_list_screen.dart';
import '../screens/entities/${cls.tableName}_form_screen.dart';`).join('\n')}

class AppRoutes {
  static final GoRouter router = GoRouter(
    routes: [
${routes.join('\n')}
    ],
  );
}`;
    }

    generateListScreen(cls) {
        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../models/${cls.tableName}_model.dart';
import '../../providers/${cls.tableName}_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart';

class ${cls.className}ListScreen extends StatefulWidget {
  @override
  _${cls.className}ListScreenState createState() => _${cls.className}ListScreenState();
}

class _${cls.className}ListScreenState extends State<${cls.className}ListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<${cls.className}Provider>().loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${cls.name}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.go('/${cls.tableName}/form'),
          ),
        ],
      ),
      body: Consumer<${cls.className}Provider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const LoadingWidget();
          }

          if (provider.error != null) {
            return CustomErrorWidget(
              message: provider.error!,
              onRetry: () => provider.loadAll(),
            );
          }

          if (provider.items.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadAll(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.items.length,
              itemBuilder: (context, index) {
                final item = provider.items[index];
                return _buildItemCard(item);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildItemCard(${cls.className} item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text('${cls.name} #\${item.id ?? ""}'),
        subtitle: Text(_getSubtitle(item)),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: ListTile(
                leading: Icon(Icons.edit),
                title: Text('Edit'),
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: Icon(Icons.delete, color: Colors.red),
                title: Text('Delete'),
              ),
            ),
          ],
          onSelected: (value) => _handleMenuAction(value, item),
        ),
        onTap: () => context.go('/${cls.tableName}/form/\${item.id}'),
      ),
    );
  }

  String _getSubtitle(${cls.className} item) {
    // Mostrar el primer atributo que no sea ID
    ${this.getFirstNonIdAttribute(cls)}
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No ${cls.tableName} found',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap the + button to create your first ${cls.tableName}',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  void _handleMenuAction(String action, ${cls.className} item) {
    switch (action) {
      case 'edit':
        context.go('/${cls.tableName}/form/\${item.id}');
        break;
      case 'delete':
        _showDeleteConfirmation(item);
        break;
    }
  }

  void _showDeleteConfirmation(${cls.className} item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text('Are you sure you want to delete this ${cls.tableName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteItem(item);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteItem(${cls.className} item) async {
    try {
      await context.read<${cls.className}Provider>().delete(item.id!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('${cls.className} deleted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting ${cls.tableName}: \$e')),
        );
      }
    }
  }
}`;
    }

    generateFormScreen(cls) {
        const attributes = this.parseAttributes(cls.attributes);
        const foreignKeys = this.getForeignKeys(cls);

        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../models/${cls.tableName}_model.dart';
import '../../providers/${cls.tableName}_provider.dart';
${foreignKeys.map(fk => `import '../../providers/${fk.tableName}_provider.dart';`).join('\n')}
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_dropdown.dart';
import '../../widgets/common/custom_button.dart';

class ${cls.className}FormScreen extends StatefulWidget {
  final int? id;

  const ${cls.className}FormScreen({Key? key, this.id}) : super(key: key);

  @override
  _${cls.className}FormScreenState createState() => _${cls.className}FormScreenState();
}

class _${cls.className}FormScreenState extends State<${cls.className}FormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  ${cls.className}? _current${cls.className};

  // Controllers
${attributes.filter(attr => attr.name !== 'id').map(attr =>
  `  final _${attr.name}Controller = TextEditingController();`
).join('\n')}

  // Selected values for foreign keys
${foreignKeys.map(fk => `  int? _selected${fk.className}Id;`).join('\n')}

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    // Load foreign key data
${foreignKeys.map(fk => `    context.read<${fk.className}Provider>().loadAll();`).join('\n')}

    // Load current item if editing
    if (widget.id != null) {
      try {
        final item = await context.read<${cls.className}Provider>().getById(widget.id!);
        setState(() {
          _current${cls.className} = item;
          _populateForm(item);
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error loading ${cls.tableName}: \$e')),
          );
        }
      }
    }
  }

  void _populateForm(${cls.className} item) {
${attributes.filter(attr => attr.name !== 'id').map(attr => {
  if (attr.dartType === 'String') {
    return `    _${attr.name}Controller.text = item.${attr.name} ?? '';`;
  } else if (attr.dartType === 'int' || attr.dartType === 'double') {
    return `    _${attr.name}Controller.text = item.${attr.name}?.toString() ?? '';`;
  } else if (attr.dartType === 'DateTime') {
    return `    _${attr.name}Controller.text = item.${attr.name}?.toLocal().toString().split(' ')[0] ?? '';`;
  }
  return `    _${attr.name}Controller.text = item.${attr.name}?.toString() ?? '';`;
}).join('\n')}

${foreignKeys.map(fk => `    _selected${fk.className}Id = item.${fk.propertyName};`).join('\n')}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.id == null ? 'New ${cls.className}' : 'Edit ${cls.className}'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _handleSave,
            child: const Text('SAVE'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
${attributes.filter(attr => attr.name !== 'id').map(attr => {
  if (attr.dartType === 'String') {
    return `            CustomTextField(
              controller: _${attr.name}Controller,
              label: '${attr.name}',
              ${attr.required ? `validator: (value) => value?.isEmpty ?? true ? '${attr.name} is required' : null,` : ''}
            ),`;
  } else if (attr.dartType === 'int' || attr.dartType === 'double') {
    return `            CustomTextField(
              controller: _${attr.name}Controller,
              label: '${attr.name}',
              keyboardType: TextInputType.number,
              ${attr.required ? `validator: (value) => value?.isEmpty ?? true ? '${attr.name} is required' : null,` : ''}
            ),`;
  } else if (attr.dartType === 'DateTime') {
    return `            CustomTextField(
              controller: _${attr.name}Controller,
              label: '${attr.name}',
              keyboardType: TextInputType.datetime,
              ${attr.required ? `validator: (value) => value?.isEmpty ?? true ? '${attr.name} is required' : null,` : ''}
            ),`;
  }
  return `            CustomTextField(
              controller: _${attr.name}Controller,
              label: '${attr.name}',
              ${attr.required ? `validator: (value) => value?.isEmpty ?? true ? '${attr.name} is required' : null,` : ''}
            ),`;
}).join('\n            const SizedBox(height: 16),\n')}

${foreignKeys.map(fk => {
  const relatedClass = this.classes.find(c => c.className === fk.className);
  const displayAttr = this.getFirstDisplayAttribute(relatedClass);

  return `            Consumer<${fk.className}Provider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const CircularProgressIndicator();
                }
                return CustomDropdown<int>(
                  label: '${fk.className}',
                  value: _selected${fk.className}Id,
                  items: provider.items.map((item) => DropdownMenuItem<int>(
                    value: item.id,
                    child: Text(${displayAttr}),
                  )).toList(),
                  onChanged: (value) => setState(() => _selected${fk.className}Id = value),
                  ${fk.required ? `validator: (value) => value == null ? '${fk.className} is required' : null,` : ''}
                );
              },
            ),`;
}).join('\n            const SizedBox(height: 16),\n')}

            const SizedBox(height: 32),
            CustomButton(
              onPressed: _isLoading ? null : _handleSave,
              text: widget.id == null ? 'Create' : 'Update',
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final ${cls.variableName} = ${cls.className}(
${attributes.filter(attr => attr.name !== 'id').map(attr => {
  if (attr.dartType === 'int') {
    return `        ${attr.name}: int.tryParse(_${attr.name}Controller.text.trim()),`;
  } else if (attr.dartType === 'double') {
    return `        ${attr.name}: double.tryParse(_${attr.name}Controller.text.trim()),`;
  } else if (attr.dartType === 'DateTime') {
    return `        ${attr.name}: DateTime.tryParse(_${attr.name}Controller.text.trim()),`;
  } else if (attr.dartType === 'bool') {
    return `        ${attr.name}: _${attr.name}Controller.text.trim().toLowerCase() == 'true',`;
  } else {
    return `        ${attr.name}: _${attr.name}Controller.text.trim(),`;
  }
}).concat(foreignKeys.map(fk => `        ${fk.propertyName}: _selected${fk.className}Id,`)).join('\n')}
      );

      final provider = context.read<${cls.className}Provider>();

      if (widget.id == null) {
        await provider.create(${cls.variableName});
      } else {
        await provider.update(widget.id!, ${cls.variableName});
      }

      if (mounted) {
        context.go('/${cls.tableName}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving ${cls.tableName}: \$e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
${attributes.filter(attr => attr.name !== 'id').map(attr =>
  `    _${attr.name}Controller.dispose();`
).join('\n')}
    super.dispose();
  }
}`;
    }

    // ==================== PROVIDERS ====================

    async generateProviders(zip) {
        console.log('🔄 Generando providers...');

        // Auth provider
        if (this.hasAuthentication) {
            zip.file('lib/providers/auth_provider.dart', this.generateAuthProvider());
        }

        // Entity providers
        for (const cls of this.classes) {
            const providerContent = this.generateEntityProvider(cls);
            zip.file(`lib/providers/${cls.tableName}_provider.dart`, providerContent);
        }
    }

    generateEntityProvider(cls) {
        return `import 'package:flutter/foundation.dart';
import '../models/${cls.tableName}_model.dart';
import '../services/${cls.tableName}_service.dart';

class ${cls.className}Provider with ChangeNotifier {
  final ${cls.className}Service _service = ${cls.className}Service();

  List<${cls.className}> _items = [];
  bool _isLoading = false;
  String? _error;

  List<${cls.className}> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAll() async {
    _setLoading(true);
    _clearError();

    try {
      _items = await _service.getAll();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load ${cls.tableName}: \$e');
    } finally {
      _setLoading(false);
    }
  }

  Future<${cls.className}> getById(int id) async {
    try {
      return await _service.getById(id);
    } catch (e) {
      throw Exception('Failed to load ${cls.tableName}: \$e');
    }
  }

  Future<void> create(${cls.className} ${cls.variableName}) async {
    try {
      final created = await _service.create(${cls.variableName});
      _items.add(created);
      notifyListeners();
    } catch (e) {
      throw Exception('Failed to create ${cls.tableName}: \$e');
    }
  }

  Future<void> update(int id, ${cls.className} ${cls.variableName}) async {
    try {
      final updated = await _service.update(id, ${cls.variableName});
      final index = _items.indexWhere((item) => item.id == id);
      if (index != -1) {
        _items[index] = updated;
        notifyListeners();
      }
    } catch (e) {
      throw Exception('Failed to update ${cls.tableName}: \$e');
    }
  }

  Future<void> delete(int id) async {
    try {
      await _service.delete(id);
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
    } catch (e) {
      throw Exception('Failed to delete ${cls.tableName}: \$e');
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}`;
    }

    // ==================== WIDGETS COMUNES ====================

    async generateCommonWidgets(zip) {
        console.log('🧩 Generando widgets comunes...');

        zip.file('lib/widgets/common/custom_text_field.dart', this.generateCustomTextField());
        zip.file('lib/widgets/common/custom_button.dart', this.generateCustomButton());
        zip.file('lib/widgets/common/custom_dropdown.dart', this.generateCustomDropdown());
        zip.file('lib/widgets/common/loading_widget.dart', this.generateLoadingWidget());
        zip.file('lib/widgets/common/error_widget.dart', this.generateErrorWidget());
    }

    generateCustomTextField() {
        return `import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffixIcon;
  final int maxLines;

  const CustomTextField({
    Key? key,
    required this.controller,
    required this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.suffixIcon,
    this.maxLines = 1,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffixIcon,
      ),
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      maxLines: maxLines,
    );
  }
}`;
    }

    generateCustomButton() {
        return `import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String text;
  final bool isLoading;
  final bool isOutlined;
  final Color? color;

  const CustomButton({
    Key? key,
    required this.onPressed,
    required this.text,
    this.isLoading = false,
    this.isOutlined = false,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isOutlined) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        child: _buildContent(),
      );
    }

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (isLoading) {
      return const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    return Text(text);
  }
}`;
    }

    generateCustomDropdown() {
        return `import 'package:flutter/material.dart';

class CustomDropdown<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final void Function(T?)? onChanged;
  final String? Function(T?)? validator;

  const CustomDropdown({
    Key? key,
    required this.label,
    this.value,
    required this.items,
    this.onChanged,
    this.validator,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
      ),
      items: items,
      onChanged: onChanged,
      validator: validator,
    );
  }
}`;
    }

    generateLoadingWidget() {
        return `import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({Key? key, this.message}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ],
      ),
    );
  }
}`;
    }

    generateErrorWidget() {
        return `import 'package:flutter/material.dart';

class CustomErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const CustomErrorWidget({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Error',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }
}`;
    }

    getForeignKeys(cls) {
        const attributes = this.parseAttributes(cls.attributes);
        const foreignKeys = [];
        const addedKeys = new Set(); // Para evitar duplicados

        // 1. Detectar FKs por nombre (ej: universidadId, userId, etc.)
        for (const attr of attributes) {
            if (attr.name.toLowerCase().endsWith('id') && attr.name.toLowerCase() !== 'id') {
                const entityName = attr.name.substring(0, attr.name.length - 2);
                const relatedClass = this.classes.find(c =>
                    c.variableName.toLowerCase() === entityName.toLowerCase() ||
                    c.className.toLowerCase() === entityName.toLowerCase()
                );

                if (relatedClass) {
                    const key = `${attr.name}_${relatedClass.className}`;
                    if (!addedKeys.has(key)) {
                        foreignKeys.push({
                            propertyName: attr.name,
                            className: relatedClass.className,
                            tableName: relatedClass.tableName,
                            variableName: relatedClass.variableName,
                            required: attr.required
                        });
                        addedKeys.add(key);
                    }
                }
            }
        }

        // 2. Detectar FKs desde relaciones del diagrama
        if (this.relationships && this.relationships.length > 0) {
            this.relationships.forEach(rel => {
                let needsForeignKey = false;
                let relatedClass = null;
                let fkName = null;

                // Determinar si esta clase necesita FK basándose en multiplicidades
                if (rel.targetClass === cls.className) {
                    // Si source es "1" y target es "*", entonces target necesita FK
                    if ((rel.sourceMultiplicity === '1' || rel.sourceMultiplicity === '1..1') &&
                        (rel.targetMultiplicity === '*' || rel.targetMultiplicity === '0..*' || rel.targetMultiplicity === '1..*' || rel.targetMultiplicity === 'many')) {
                        needsForeignKey = true;
                        const sourceClassObj = this.classes.find(c => c.className === rel.sourceClass);
                        if (sourceClassObj) {
                            relatedClass = sourceClassObj;
                            fkName = `${sourceClassObj.variableName}Id`;
                        }
                    }
                } else if (rel.sourceClass === cls.className) {
                    // Si target es "1" y source es "*", entonces source necesita FK
                    if ((rel.targetMultiplicity === '1' || rel.targetMultiplicity === '1..1') &&
                        (rel.sourceMultiplicity === '*' || rel.sourceMultiplicity === '0..*' || rel.sourceMultiplicity === '1..*' || rel.sourceMultiplicity === 'many')) {
                        needsForeignKey = true;
                        const targetClassObj = this.classes.find(c => c.className === rel.targetClass);
                        if (targetClassObj) {
                            relatedClass = targetClassObj;
                            fkName = `${targetClassObj.variableName}Id`;
                        }
                    }
                }

                // Agregar FK si no está ya en la lista
                if (needsForeignKey && relatedClass && fkName) {
                    const key = `${fkName}_${relatedClass.className}`;
                    if (!addedKeys.has(key)) {
                        foreignKeys.push({
                            propertyName: fkName,
                            className: relatedClass.className,
                            tableName: relatedClass.tableName,
                            variableName: relatedClass.variableName,
                            required: true // Las FKs de relaciones son generalmente requeridas
                        });
                        addedKeys.add(key);
                        console.log(`🔑 FK detectada desde relación: ${cls.className}.${fkName} -> ${relatedClass.className}`);
                    }
                }
            });
        }

        return foreignKeys;
    }

    getFirstNonIdAttribute(cls) {
        const attributes = this.parseAttributes(cls.attributes);
        const firstAttr = attributes.find(attr => attr.name.toLowerCase() !== 'id');

        if (firstAttr) {
            return `return item.${firstAttr.name}?.toString() ?? 'No ${firstAttr.name}';`;
        }

        return `return 'ID: \${item.id ?? ""}';`;
    }

    getFirstDisplayAttribute(cls) {
        if (!cls) return `'ID: \${item.id ?? ""}'`;

        const attributes = this.parseAttributes(cls.attributes);

        // Priorizar atributos comunes para display
        const priorityNames = ['nombre', 'name', 'titulo', 'title', 'descripcion', 'description', 'email', 'username'];

        // Buscar primero en atributos prioritarios
        for (const priority of priorityNames) {
            const attr = attributes.find(a => a.name.toLowerCase() === priority);
            if (attr) {
                return `'\${item.${attr.name} ?? "Sin ${attr.name}"} (ID: \${item.id})'`;
            }
        }

        // Si no hay atributo prioritario, usar el primer atributo que no sea ID
        const firstAttr = attributes.find(attr =>
            attr.name.toLowerCase() !== 'id' &&
            !attr.name.toLowerCase().endsWith('id')
        );

        if (firstAttr) {
            return `'\${item.${firstAttr.name} ?? "Sin ${firstAttr.name}"} (ID: \${item.id})'`;
        }

        // Fallback: solo mostrar ID
        return `'ID: \${item.id ?? ""}'`;
    }

    generateAuthProvider() {
        return `import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  bool _isAuthenticated = false;
  String? _token;
  bool _isLoading = false;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _isAuthenticated = _token != null;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final result = await _authService.login(email, password);
      _token = result['token'];
      _isAuthenticated = true;

      // Save token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);

      notifyListeners();
    } catch (e) {
      _setError('Login failed: \$e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> register(String name, String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      await _authService.register(name, email, password);
      notifyListeners();
    } catch (e) {
      _setError('Registration failed: \$e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _token = null;
    _isAuthenticated = false;

    // Clear stored token
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');

    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}`;
    }

    generateAuthService() {
        return `import '../services/api_service.dart';
import '../config/api_config.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        ApiConfig.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final token = response.data['token'];
        _apiService.setAuthToken(token);
        return response.data;
      }

      throw Exception('Invalid credentials');
    } catch (e) {
      throw Exception('Login failed: \$e');
    }
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        ApiConfig.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      }

      throw Exception('Registration failed');
    } catch (e) {
      throw Exception('Registration failed: \$e');
    }
  }

  Future<void> logout() async {
    _apiService.clearAuthToken();
  }
}`;
    }

    generateAnalysisOptions() {
        return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - avoid_print
    - prefer_const_constructors
    - prefer_const_literals_to_create_immutables
    - prefer_const_declarations
    - unnecessary_const
    - unnecessary_new

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"`;
    }

    generateAndroidBuildGradle() {
        return `plugins {
    id "com.android.application"
    id "kotlin-android"
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace = "${this.packageName}"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_1_8
    }

    defaultConfig {
        applicationId = "${this.packageName}"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.debug
        }
    }
}

flutter {
    source = "../.."
}`;
    }

    generateAndroidManifest() {
        return `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="${this.projectName}"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <!-- Specifies an Android theme to apply to this Activity as soon as
                 the Android process has started. This theme is visible to the user
                 while the Flutter UI initializes. After that, this theme continues
                 to determine the Window background behind the Flutter UI. -->
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <!-- Don't delete the meta-data below.
             This is used by the Flutter tool to generate GeneratedPluginRegistrant.java -->
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
    <!-- Required to query activities that can process text, see:
         https://developer.android.com/training/package-visibility and
         https://developer.android.com/reference/android/content/Intent#ACTION_PROCESS_TEXT.

         In particular, this is used by the Flutter engine in io.flutter.plugin.text.ProcessTextPlugin. -->
    <queries>
        <intent>
            <action android:name="android.intent.action.PROCESS_TEXT"/>
            <data android:mimeType="text/plain"/>
        </intent>
    </queries>
</manifest>`;
    }

    generateConstants() {
        return `class AppConstants {
  // App info
  static const String appName = '${this.projectName.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}';
  static const String appVersion = '1.0.0';

  // Storage keys
  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';

  // Validation
  static const int minPasswordLength = 6;
  static const int maxNameLength = 50;

  // UI
  static const double defaultPadding = 16.0;
  static const double cardRadius = 12.0;
  static const double buttonHeight = 48.0;

  // Network
  static const int networkTimeout = 30;
  static const int maxRetries = 3;
}`;
    }

    generateMainActivity() {
        return `package ${this.packageName}

import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity()`;
    }

    generateAndroidStylesXml() {
        return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Theme applied to the Android Window while the process is starting when the OS's Dark Mode setting is off -->
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <!-- Show a splash screen on the activity. Automatically removed when
             the Flutter engine draws its first frame -->
        <item name="android:windowBackground">@drawable/launch_background</item>
    </style>
    <!-- Theme applied to the Android Window as soon as the process has started.
         This theme determines the color of the Android Window while your
         Flutter UI initializes, as well as behind your Flutter UI while its
         running.

         This Theme is only used starting with V2 of Flutter's Android embedding. -->
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">?android:colorBackground</item>
    </style>
</resources>`;
    }

    generateAndroidStylesNightXml() {
        return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Theme applied to the Android Window while the process is starting when the OS's Dark Mode setting is on -->
    <style name="LaunchTheme" parent="@android:style/Theme.Black.NoTitleBar">
        <!-- Show a splash screen on the activity. Automatically removed when
             the Flutter engine draws its first frame -->
        <item name="android:windowBackground">@drawable/launch_background</item>
    </style>
    <!-- Theme applied to the Android Window as soon as the process has started.
         This theme determines the color of the Android Window while your
         Flutter UI initializes, as well as behind your Flutter UI while its
         running.

         This Theme is only used starting with V2 of Flutter's Android embedding. -->
    <style name="NormalTheme" parent="@android:style/Theme.Black.NoTitleBar">
        <item name="android:windowBackground">?android:colorBackground</item>
    </style>
</resources>`;
    }

    generateLaunchBackgroundXml() {
        return `<?xml version="1.0" encoding="utf-8"?>
<!-- Modify this file to customize your launch splash screen -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@android:color/white" />

    <!-- You can insert your own image assets here -->
    <!-- <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/launch_image" />
    </item> -->
</layer-list>`;
    }

    generateLaunchBackgroundV21Xml() {
        return `<?xml version="1.0" encoding="utf-8"?>
<!-- Modify this file to customize your launch splash screen -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="?android:colorBackground" />

    <!-- You can insert your own image assets here -->
    <!-- <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/launch_image" />
    </item> -->
</layer-list>`;
    }

    generateAndroidIconPlaceholder() {
        // Create a simple base64 PNG placeholder icon (48x48 white square with blue border)
        return 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADYSURBVGhD7ZjBDYAgDEWpB7yYneMS13AUN5gbIx6QgRqTGiAk0P+ThENf+dCUJFmWZQ2Uusd1mXXD5V74LXJcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JcF3JclySJbQD2fM5HMLL+RQAAAABJRU5ErkJggg==';
    }

    generateRootBuildGradle() {
        return `allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.buildDir = "../build"
subprojects {
    project.buildDir = "\${rootProject.buildDir}/\${project.name}"
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register("clean", Delete) {
    delete rootProject.buildDir
}`;
    }

    generateGradleProperties() {
        return `org.gradle.jvmargs=-Xmx1536M
android.useAndroidX=true
android.enableJetifier=true`;
    }

    generateSettingsGradle() {
        return `pluginManagement {
    def flutterSdkPath = {
        def properties = new Properties()
        file("local.properties").withInputStream { properties.load(it) }
        def flutterSdkPath = properties.getProperty("flutter.sdk")
        assert flutterSdkPath != null, "flutter.sdk not set in local.properties"
        return flutterSdkPath
    }()

    includeBuild("\$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id "dev.flutter.flutter-plugin-loader" version "1.0.0"
    id "com.android.application" version "8.1.0" apply false
    id "org.jetbrains.kotlin.android" version "1.8.22" apply false
}

include ":app"`;
    }

    generateInfoPlist() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>\$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>\${PRODUCT_NAME}</string>
	<key>CFBundleExecutable</key>
	<string>\$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>\$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>\${PRODUCT_NAME}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>\$(FLUTTER_BUILD_NAME)</string>
	<key>CFBundleSignature</key>
	<string>????</string>
	<key>CFBundleVersion</key>
	<string>\$(FLUTTER_BUILD_NUMBER)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<false/>
	<key>CADisableMinimumFrameDurationOnPhone</key>
	<true/>
	<key>UIApplicationSupportsIndirectInputEvents</key>
	<true/>
</dict>
</plist>`;
    }

    generateGradleWrapperProperties() {
        return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.3-all.zip`;
    }

    // ==================== UTILIDADES DE NAMING ====================

    toCamelCase(str) {
        return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\\s+/g, '');
    }

    toPascalCase(str) {
        return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, (word) => {
            return word.toUpperCase();
        }).replace(/\\s+/g, '');
    }

    toSnakeCase(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    // ==================== MÉTODO ESTÁTICO ====================

    static async quickGenerateFlutter(editor) {
        const generator = new SimpleFlutterGenerator(editor);
        return await generator.generateFlutterProject();
    }
}

// Método estático para uso rápido
SimpleFlutterGenerator.quickGenerateFlutter = function(editor) {
    const generator = new SimpleFlutterGenerator(editor);
    return generator.generateFlutterProject();
};
