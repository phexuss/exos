import 'package:flutter/material.dart';

/// A scrolling page inside the content panel, with a thin overlay scrollbar.
class PageScroll extends StatefulWidget {
  const PageScroll({super.key, required this.children, this.padding = const EdgeInsets.fromLTRB(36, 30, 36, 40)});
  final List<Widget> children;
  final EdgeInsets padding;

  @override
  State<PageScroll> createState() => _PageScrollState();
}

class _PageScrollState extends State<PageScroll> {
  final _c = ScrollController();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scrollbar(
    controller: _c,
    child: SingleChildScrollView(
      controller: _c,
      padding: widget.padding,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: widget.children),
    ),
  );
}
